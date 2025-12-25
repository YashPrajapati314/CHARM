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


interface StructuredResponse {
  dates: string[];
  reason: string;
  text?: string;
}


const TOGETHER_AI_API_KEY_1: string = process.env.TOGETHER_AI_API_KEY_1 || '';
const TOGETHER_AI_API_KEY_2: string = process.env.TOGETHER_AI_API_KEY_2 || '';
const GPT4_API_KEY: string = process.env.GPT4_API_KEY || '';
const GEMINI_API_KEY_1: string = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_2 || '';
const GEMINI_API_KEY_2: string = process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_1 || '';

const response_schema_for_date_and_reason_extraction = {
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

const response_schema_for_date_reason_and_text_extraction = {
  "type": "json_schema",
  "json_schema": {
    "name": "letter_details",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "The entire extracted text of the document, including content inside tables, numbers, etc",
        },
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
        "text",
        "dates",
        "reason"
      ],
      "additionalProperties": false
    }
  }
}


const SYSTEM_PROMPT_FOR_DATE_AND_REASON_EXTRACTION = `You are an expert at structured data extraction from image. You will be given images of letters that are a request to grant attenadnce to certain students for some dates and your task is to extract the following details from them:
1) The dates for which those students will be granted attendance. This can be mentioned in any format and the correct set of dates are usually mentioned just before the list of students start. Multiple dates can also be mentioned and sometimes the dates can be mentioned as a range as well, for example: 14th February 2025 to 18th February 2025 in which case you should return all the dates between 14 and 18, inclusive of both ends (i.e. 2025-02-14, 2025-02-15, 2025-02-16, 2025-02-17, 2025-02-18) in YYYY-MM-DD format. If the year for a particular date is not mentioned, assume it to be the current year ie ${(new Date()).getFullYear()}. However, if there are hints of the letter being dated near the end of the year, e.g. December 20, ${(new Date()).getFullYear()} and the request is likely for a date from the upcoming year, e.g. January 4, assume the date for January 4 to be ${(new Date()).getFullYear() + 1} i.e. the next year.
2) A summarized reason for receiving attendance. This can be known from the subject or the body of the letter. Keep the reason short and to the point, avoid mentioning redundant phrases like "Request to" or "Attendance for" and only mention the task/event that the students are working with along with the name of the committee if any. For example: 'Sport Day Preparation' and NOT 'Request to grant attendance to students involved in making preparations for Sports Day'.
The input image can also be the second or third page of a letter which might only contain student details or the complimentary close and no relevant information to infer the reason from. In such a case, just return an empty string for the reason and an empty list for the dates.
You may also receive images that are not of letters. In such a case, please still return any visible dates or reasons that you might find (some text visible in the image can be identified as valid reasons in this case). Remember, the reason needs to be brief and the dates can be mentioned as a range as well.`;

const SYSTEM_PROMPT_FOR_DATE_REASON_AND_TEXT_EXTRACTION = `You are an expert at structured data extraction from image. You will be given images of letters that are a request to grant attenadnce to certain students for some dates and your task is to extract the following details from them:
1) The entire textual content of the document, including content inside tables, numbers, symbols, etc. returned as plain text.
2) The dates for which those students will be granted attendance. This can be mentioned in any format and the correct set of dates are usually mentioned just before the list of students start. Multiple dates can also be mentioned and sometimes the dates can be mentioned as a range as well, for example: 14th February 2025 to 18th February 2025 in which case you should return all the dates between 14 and 18, inclusive of both ends (i.e. 2025-02-14, 2025-02-15, 2025-02-16, 2025-02-17, 2025-02-18) in YYYY-MM-DD format. If the year for a particular date is not mentioned, assume it to be the current year ie ${(new Date()).getFullYear()}. However, if there are hints of the letter being dated near the end of the year, e.g. December 20, ${(new Date()).getFullYear()} and the request is likely for a date from the upcoming year, e.g. January 4, assume the date for January 4 to be ${(new Date()).getFullYear() + 1} i.e. the next year.
3) A summarized reason for receiving attendance. This can be known from the subject or the body of the letter. Keep the reason short and to the point, avoid mentioning redundant phrases like "Request to" or "Attendance for" and only mention the task/event that the students are working with along with the name of the committee if any. For example: 'Sport Day Preparation' and NOT 'Request to grant attendance to students involved in making preparations for Sports Day'.
The input image can also be the second or third page of a letter which might only contain student details or the complimentary close and no relevant information to infer the reason from. In such a case, just return an empty string for the reason and an empty list for the dates.
You may also receive images that are not of letters. In such a case, please still return any visible dates or reasons that you might find (some text visible in the image can be identified as valid reasons in this case). Remember, the reason needs to be brief and the dates can be mentioned as a range as well.`;

// const SYSTEM_PROMPT_FOR_LLAMA = `You are an expert at extracting text accurately from images. You will be given images that may or may not be print documents, which can have text anywhere on the page. Your task is to extract all the 11 digit numbers from the image and only the ones that occur on the page. The numbers are exactly 11 digit long, please don't miss out any digit or read any extra digit.`;
// const SYSTEM_PROMPT_FOR_LLAMA = `You are an expert at extracting text accurately from images. You will be given images that may or may not be print documents, which can have text anywhere on the page. Your task is to extract all the 11 digit numbers from the image and only the ones that occur on the page. The numbers are exactly 11 digit long, please don't miss out any digit or read any extra digit. Examples include, but are not limited to: <example>60004230019</example>`;

const SYSTEM_PROMPT_FOR_SAPID_EXTRACTION = `You are an expert at extracting text accurately from images. You will be given images that may or may not be print documents which can have text anywhere on the page. Your task is to extract all the 11 digit numbers from the image and only the ones that occur on the page`;
const SYSTEM_PROMPT_FOR_TEXT_EXTRACTION = `You are an expert at extracting text accurately from images. You will be given images that may or may not be print documents, which can have text anywhere on the page, even in tables. Your task is to extract all the text from the image, including numbers, symbols, etc. precisely, and return them as plain text`;


function extractSAPIDsFromText(text: string): number[] {
  const SAPID_REGEX = /[0-9]{11}/g;
  let sapids = text.match(SAPID_REGEX)?.map((id) => parseInt(id, 10)) || [];
  return sapids
}

async function getSAPIDsFromLlamaVision(API_KEY: string, imgBase64: FormDataEntryValue) {
  try
  {
    const together = new Together({
      apiKey: API_KEY
    });

    const completion = await together.chat.completions.create({
      model: 'meta-llama/Llama-Vision-Free',
      messages: [
        {role: 'system', content: SYSTEM_PROMPT_FOR_SAPID_EXTRACTION},
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
      sapids = extractSAPIDsFromText(extractedText);
      return sapids;
    }
    else
    {
      console.log(`Llama OCR didn't respond: \n${JSON.stringify(completion, null, 2)}\n`);
      return null;
    }
  }
  catch (error)
  {
    console.log(`Llama Vision failed: ${error}\n`);
    return null;
  }
}

async function getSAPIDsFromGemma(API_KEY: string, imgBase64: FormDataEntryValue) {
  try {
    const together = new Together({
      apiKey: API_KEY
    });

    const completion = await together.chat.completions.create({
      model: 'google/gemma-3n-E4B-it',
      messages: [
        {role: 'system', content: SYSTEM_PROMPT_FOR_TEXT_EXTRACTION},
        {role: 'user', content: [{  // @ts-ignore
          // 'text': 'Please extract all the 11 digit numbers from the given image', 
          'text': 'Please extract all the text from the given image', 
          'type': 'image_url', // @ts-ignore
          'image_url': {'url': imgBase64}
        }]} 
      ],
      temperature: 0,
      // frequency_penalty: 0
    });

    const extractedText = completion?.choices[0].message?.content;

    let sapids: number[] = [];
    
    if(extractedText) {
      console.log(`Gemma responded for SAP IDs: \n${extractedText}\n`);
      sapids = extractSAPIDsFromText(extractedText);
      return sapids;
    }
    else {
      console.log(`Gemma didn't respond: \n${JSON.stringify(completion, null, 2)}\n`);
      return null;
    }
  }
  catch (error) {
    console.log(`Gemma failed: ${error}\n`);
    return null;
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
      console.log(`Paddle Response Error: ${paddleResponse.statusText}`);
      return null;
    }
  }
  catch (error)
  {
    console.log(`Paddle OCR failed: ${error}\n`);
    return null;
  }
}

async function getDatesAndReasonFromGPT4(API_KEY: string, imgBase64: FormDataEntryValue, getFullText: boolean): Promise<StructuredResponse | null> {
  try
  {
    const openai = new OpenAI({
      apiKey: API_KEY
    });
    // @ts-ignore
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {role: 'system', content: getFullText ? SYSTEM_PROMPT_FOR_DATE_REASON_AND_TEXT_EXTRACTION : SYSTEM_PROMPT_FOR_DATE_AND_REASON_EXTRACTION},
        {role: 'user', content: [{
          'type': 'image_url', // @ts-ignore
          'image_url': {'url': imgBase64}
        }]} 
      ], // @ts-ignore
      response_format: getFullText ? response_schema_for_date_reason_and_text_extraction : response_schema_for_date_and_reason_extraction,
      temperature: 0
    });

    const extractedText = completion?.choices[0].message?.content;
    if (extractedText) {
      console.log(`GPT responded with dates and reason: \n${extractedText}\n`);
      const parsedDetails = JSON.parse(extractedText);
      if (parsedDetails) {
        return parsedDetails;
      } 
      else {
        return null;
      }
    }
    else {
      return null;
    }
  }
  catch
  {
    return null;
  }
}


async function getDatesAndReasonFromGemini(API_KEY: string, img: Blob): Promise<StructuredResponse | null> {
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
        systemInstruction: SYSTEM_PROMPT_FOR_DATE_AND_REASON_EXTRACTION,
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
        return null;
      }
    }
    else
    {
      return null;
    }
  }
  catch (error)
  {
    console.log(error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // return NextResponse.json({ error: 'Failed to process the image.', details: '...' }, { status: 500 });

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

    const finalresult = await Promise.all(
      allImages.map(async (anImage) => {
        let sapids =  (await getSAPIDsFromGemma(TOGETHER_AI_API_KEY_2, anImage.imageBase64)) || 
                      (await getSAPIDsFromLlamaVision(TOGETHER_AI_API_KEY_1, anImage.imageBase64)) || 
                      (await getSAPIDsFromLlamaVision(TOGETHER_AI_API_KEY_2, anImage.imageBase64)) || 
                      // (await getSAPIDsFromPaddleOCR(anImage.imageFile)) || 
                      [];
        
        sapids.forEach((sapid: number) => {
            sapidset.add(sapid);
        });

        let getFullText;
        
        if (sapids.length === 0) {
          getFullText = true;
        }
        else {
          getFullText = false;
        }

        let parsedDetails = (await getDatesAndReasonFromGPT4(GPT4_API_KEY, anImage.imageBase64, getFullText)) || 
                            (await getDatesAndReasonFromGemini(GEMINI_API_KEY_1, anImage.imageFile));

        if(parsedDetails) {
          parsedDetails?.dates.map((date: string) => {
            dates.add(date);
          });
          let reason: string = parsedDetails?.reason || '';
          reason = reason.trim();
          if (reason !== '') {
            reasons.add(reason);
          }
          if (getFullText) {
            const extractedText = parsedDetails.text || ''
            sapids = extractSAPIDsFromText(extractedText);
            sapids.forEach((sapid: number) => {
                sapidset.add(sapid);
            });
          }
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
