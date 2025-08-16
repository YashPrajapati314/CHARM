import { NextRequest, NextResponse } from 'next/server';
import openAI, { OpenAI } from 'openai';
import Together from 'together-ai';
import { GoogleGenAI, Type } from "@google/genai";
import { date, string, z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { zodResponseFormat } from 'openai/helpers/zod';
import fs from 'fs';
import path from 'path';
import { Bubblegum_Sans } from 'next/font/google';


export const config = {
  api: {
    bodyParser: false,
  }
};

const TOGETHER_AI_API_KEY_1: string = process.env.TOGETHER_AI_API_KEY_1 || '';
const TOGETHER_AI_API_KEY_2: string = process.env.TOGETHER_AI_API_KEY_2 || '';
const GPT4_API_KEY: string = process.env.GPT4_API_KEY || '';
const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || '';

const response_schema_for_gpt4 = {
  "type": "json_schema",
  "json_schema": {
    "name": "letter_details",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "dates": {
          "type": "array",
          "description": "A list of dates on which attendance is being granted. Can be mentioned as a range. Example: Date A to Date B in which case every date within that range including A and B have to be returned in YYYY-MM-DD format",
          "items": {
            "type": "string",
            "description": "Dates in YYYY-MM-DD format."
          }
        },
        "reason": {
          "type": "string",
          "description": "The reason due to which the students are being granted attendance. A very short descriptive phrase that just mentions the event/work they are busy with. Can be extracted from the subject or body of the letter only if it is the first page. If the exact reason can't be found, return an empty string."
        }
      },
      "required": [
        "dates",
        "reason"
      ],
      "additionalProperties": false
    }
  }
}


const SYSTEM_PROMPT_FOR_GPT4_AND_GEMINI = `You are an expert at structured data extraction from image. You will be given images of letters that are a request to grant attenadnce to certain students for some dates and your task is to extract the following details from them:
1) The dates for which those students will be granted attendance. This can be mentioned in any format and the correct set of dates are usually mentioned just before the list of students start. Multiple dates can also be mentioned and sometimes the dates can be mentioned as a range as well, for example: 14th February 2025 to 18th February 2025 in which case you should return all the dates between 14 and 18, inclusive of both ends (i.e. 2025-02-14, 2025-02-15, 2025-02-16, 2025-02-17, 2025-02-18) in YYYY-MM-DD format. If the year for a particular date is not mentioned, assume it to be the current year ie ${(new Date()).getFullYear()}. However, if there are hints of the letter being dated near the end of the year, e.g. December 20, ${(new Date()).getFullYear()} and the request is likely for a date from the upcoming year, e.g. January 4, assume the date for January 4 to be ${(new Date()).getFullYear() + 1} i.e. the next year.
2) A summarized reason for receiving attendance. This can be known from the subject or the body of the letter. Keep the reason short and to the point, avoid mentioning redundant phrases like "Request to" or "Attendance for" and only mention the task/event that the students are working with along with the name of the committee if any. For example: 'Sport Day Preparation' and NOT 'Request to grant attendance to students involved in making preparations for Sports Day'.
The input image can also be the second or third page of a letter which might only contain student details or the complimentary close and no relevant information to infer the reason from. In such a case, just return an empty string for the reason and an empty list for the dates.
You may also receive images that are not of letters. In such a case, please still return any visible dates or reasons that you might find (some text visible in the image can be identified as valid reasons in this case). Remember, the reason needs to be brief and the dates can be mentioned as a range as well.`;

const SYSTEM_PROMPT_FOR_LLAMA = `You are an expert at extracting text accurately from images. You will be given images that may or may not be letters which can have text anywhere on the page. Your task is to extract all the 11 digit numbers from the image and only the ones that occur on the page.`;

export async function POST(req: NextRequest) {
  try {
    let finalSet = new Set<number>();

    const formData = await req.formData();
    const nstring = formData.get('noOfImages') as string;
    
    const n = parseInt(nstring, 10);
    
    if(n == 0) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    interface ImageFileBase64Pair {
      imageFile: Blob;
      imageBase64: FormDataEntryValue
    }

    const allImages: ImageFileBase64Pair[] = [];

    for(let i = 0; i < n; i++)
    {
      const image = formData.get(`file-${i+1}`) as Blob;
      const base64encodedImage = formData.get(`file-${i+1}-base64`);
      allImages.push({
        imageFile: image,
        imageBase64: base64encodedImage!
      });
    }

    const sapidset = new Set<number>();
    const dates = new Set<string>();
    const reasons = new Set<string>();

    async function getSAPIDsFromLlamaVision(API_KEY: string, imgBase64: FormDataEntryValue) {
      try
      {
        const together = new Together({
          apiKey: API_KEY
        });

        const completion = await together.chat.completions.create({
          model: 'meta-llama/Llama-Vision-Free',
          messages: [
            {role: 'system', content: SYSTEM_PROMPT_FOR_LLAMA},
            {role: 'user', content: [{  // @ts-ignore
              'text': 'Please extract all the 11 digit numbers from the given image', 
              'type': 'image_url', // @ts-ignore
              'image_url': {'url': imgBase64}
            }]} 
          ],
          temperature: 0
        });

        const extractedText = completion?.choices[0].message?.content;

        let sapids: number[] = [];
        
        if(extractedText)
        {
          console.log(`Llama OCR responded for SAP IDs: \n${extractedText}\n`);
          const SAPID_REGEX = /[0-9]{11}/g;          
          sapids = extractedText.match(SAPID_REGEX)?.map((id) => parseInt(id, 10)) || [];
          return sapids;
        }
        else
        {
          return undefined;
        }
      }
      catch
      {
        return undefined;
      }
    }

    async function getSAPIDsFromPaddleOCR(img: Blob) {
      try
      {
        const formDataToSend = new FormData();
        formDataToSend.append("file", img, "image.png");

        const PADDLE_ENDPOINT = process.env.PADDLE_ENDPOINT || '';

        const paddleResponse = await fetch(PADDLE_ENDPOINT, {
          method: "POST",
          body: formDataToSend
        }); 

        let sapids: number[] = [];

        if(paddleResponse.ok)
        {
          const data = await paddleResponse.json();
          sapids = data?.list || [];
          console.log(`Paddle responded with SAP IDs: \n${sapids}\n`);
          return sapids;
        }
        else
        {
          return undefined;
        }
      }
      catch
      {
        return undefined;
      }
    }

    async function getDateAndReasonFromGPT4(API_KEY: string, imgBase64: FormDataEntryValue) {
      try
      {
        const openai = new OpenAI({
          apiKey: API_KEY
        });
        // @ts-ignore
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {role: 'system', content: SYSTEM_PROMPT_FOR_GPT4_AND_GEMINI},
            {role: 'user', content: [{
              'type': 'image_url', // @ts-ignore
              'image_url': {'url': imgBase64}
            }]} 
          ], // @ts-ignore
          response_format: response_schema_for_gpt4,
          temperature: 0
        });

        const extractedText = completion?.choices[0].message?.content;
        if(extractedText)
        {
          console.log(`GPT responded with dates and reason: \n${extractedText}\n`);
          const parsedDetails = JSON.parse(extractedText);
          if(parsedDetails)
          {
            return parsedDetails;
          }
          else
          {
            return undefined;
          }
        }
        else
        {
          return undefined;
        }
      }
      catch
      {
        return undefined;
      }
    }

      async function getDateAndReasonFromGemini(API_KEY: string, img: Blob) {
        try
        {
          const gemini = new GoogleGenAI({apiKey: API_KEY});

          const response = await gemini.models.generateContent({
            model: 'gemini-2.0-flash', //
            contents: {
              inlineData: {
                mimeType: img.type,
                data: Buffer.from(await img.arrayBuffer()).toString('base64')
              }
            },
            config: {
              systemInstruction: SYSTEM_PROMPT_FOR_GPT4_AND_GEMINI,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  dates: {
                    type: Type.ARRAY,
                    description: "A list of dates on which attendance is being granted. Can be mentioned as a range. Example: Date A to Date B in which case every date within that range including A and B have to be returned in YYYY-MM-DD format",
                    items: {
                      type: Type.STRING,
                      description: "Dates in YYYY-MM-DD format."
                    }
                  },
                  reason: {
                    type: Type.STRING,
                    description: "The reason due to which the students are being granted attendance. A very short descriptive phrase that just mentions the event/work they are busy with. Can be extracted from the subject or body of the letter only if it is the first page. If the exact reason can't be found, return an empty string."
                  }
                },
                required: ['dates', 'reason']
              }
            }
          });

          const extractedText = response?.text;
          if(extractedText)
          {
            console.log(`Gemini responded with dates and reason: \n${extractedText}\n`);
            const parsedDetails = JSON.parse(extractedText);
            if(parsedDetails)
            {
              return parsedDetails;
            }
            else
            {
              return undefined;
            }
          }
          else
          {
            return undefined;
          }
        }
        catch (error)
        {
          console.log(error);
          return undefined;
        }
      }

    const finalresult = await Promise.all(
      allImages.map(async (anImage) => {
        let sapids = await getSAPIDsFromLlamaVision(TOGETHER_AI_API_KEY_1, anImage.imageBase64);
        if(sapids)
        {
          sapids.forEach((sapid: number) => {
              sapidset.add(sapid);
          });
        }
        else
        {
          let sapids = await getSAPIDsFromLlamaVision(TOGETHER_AI_API_KEY_2, anImage.imageBase64);
          if(sapids)
          {
            sapids.forEach((sapid: number) => {
                sapidset.add(sapid);
            });
          }
          else
          {
            sapids = await getSAPIDsFromPaddleOCR(anImage.imageFile);
            if(sapids)
            {
              sapids.forEach((sapid: number) => {
                  sapidset.add(sapid);
              });
            }
          }
        }
        let parsedDetails = await getDateAndReasonFromGPT4(GPT4_API_KEY, anImage.imageBase64);
        if(parsedDetails)
        {
          parsedDetails?.dates.map((date: string) => {
            dates.add(date);
          })
          let reason: string = parsedDetails?.reason || '';
          reason = reason.trim();
          if(reason !== '')
          reasons.add(reason);
        }
        else
        {
          let parsedDetails = await getDateAndReasonFromGemini(GEMINI_API_KEY, anImage.imageFile);
          parsedDetails?.dates.map((date: string) => {
            dates.add(date);
          })
          let reason: string = parsedDetails?.reason || '';
          reason = reason.trim();
          if(reason !== '')
          reasons.add(reason);
        }
      })
    );


    console.log('\nFinal SAP IDs\n', sapidset);
    console.log('\nDates:', dates);
    console.log('\nReason:', reasons);

    const finalSAPList = Array.from(sapidset);
    const finalDates = Array.from(dates);
    const finalReason = [...reasons].join(' | ')

    return NextResponse.json({ list: finalSAPList, dates: finalDates, reason: finalReason });
  } 
  catch (error: unknown) 
  {
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.log("General error:", error);
    return NextResponse.json({ error: 'Failed to process the image.', details: errorMessage }, { status: 500 });
  }
}
