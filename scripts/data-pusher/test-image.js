async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

checkImageExists('').then(exists => {
  console.log(exists ? 'Image exists.' : 'Image does not exist.');
});
