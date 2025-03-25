imageExists = [true, true, false];
const allImagesExist = imageExists.reduce((acc, curr) => (acc && curr), true);
console.log(allImagesExist);