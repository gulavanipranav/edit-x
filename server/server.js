const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
var cors = require('cors')
const htmlDocx = require('html-docx-js');
const fs = require('fs');
const HTMLtoDOCX = require('../node_modules/html-to-docx/dist/html-to-docx.umd');
const { Readable } = require('stream');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
app.use(cors())

app.use(express.json());

// Root
app.get('/', (req, res) => {
    res.send('Hello World!')
  })

// File Upload
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  // Read and manipulate the uploaded file

  var options = {
    convertImage: mammoth.images.imgElement(function(file) {
        return file.read("base64").then(function(imageBuffer) {
            return {
                src: "data:" + file.contentType + ";base64," + imageBuffer
            };
        });
    })
};
  
  mammoth.convertToHtml({ buffer: file.buffer },options)
    .then(result => {
      const html = result.value; // Extracted plain text from the DOCX file
      // Perform any desired manipulation on the text
      const images = result.messages
      .filter(msg => msg.type === 'inline-image')
      .map(msg => msg.value); // Extracted image data in base64 format
    
      const response = {
        html,
        images
      };
      res.send(response);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error processing the file');
    });
});
// convert html to docx
app.post('/convert', async(req, res) => {
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).json({ error: 'No HTML content provided' });
  }

  const sanitizedHtml = htmlContent.replace(/&nbsp;/g, '');

  const docx = htmlDocx.asBlob(sanitizedHtml);

  const fileBuffer = await HTMLtoDOCX(sanitizedHtml, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });
  
  res.setHeader('Content-Disposition', 'attachment; filename=document.docx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  return res.send(fileBuffer);
  
});
  app.listen(3001, () => {
    console.log('Server is running on port 3001');
});