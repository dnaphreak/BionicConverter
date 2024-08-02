import React, { useState, useRef } from "react";
import Button from "react-bootstrap/Button";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReturnBionicText from "./ReturnBionicText";
import DownloadPDF from "./DownloadBionicText";
import { pdfjs } from "react-pdf";
import PizZip from "pizzip";
import { DOMParser } from "@xmldom/xmldom";
import "./BionicConverter.css";

const getFileExtension = (fileName) => fileName.split('.').pop().toLowerCase();

const str2xml = (str) => {
  const cleanStr = str.charCodeAt(0) === 65279 ? str.substr(1) : str;
  return new DOMParser().parseFromString(cleanStr, "text/xml");
};

const getParagraphs = (content) => {
  const zip = new PizZip(content);
  const xml = str2xml(zip.files["word/document.xml"].asText());
  const paragraphsXml = xml.getElementsByTagName("w:p");
  
  return Array.from(paragraphsXml).reduce((acc, paragraph) => {
    const texts = paragraph.getElementsByTagName("w:t");
    const fullText = Array.from(texts).reduce((text, t) => 
      text + (t.childNodes[0]?.nodeValue || ''), '');
    return fullText ? acc + fullText : acc;
  }, '');
};

const getBionizedTextHTML = (text) => {
  return text.split(/(\b\w+\b|\S)/).map(word => {
    if (word.match(/\w+/)) {
      const halfLength = Math.floor(word.length / 2);
      return halfLength ? 
        `**${word.substring(0, halfLength)}**${word.substring(halfLength)}` :
        `**${word}**`;
    }
    return word;
  }).join('');
};

function BionicConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [originalInput, setOriginalInput] = useState('');
  const inputRef = useRef();

  const handleInput = (event) => setInput(event.target.value);

  const extractTextFromDocx = (content) => setInput(getParagraphs(content));

  const extractTextFromPDF = async (content) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.js",
      import.meta.url
    ).toString();
  
    try {
      const pdf = await pdfjs.getDocument(content).promise;
      const extractedText = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_, i) => {
          const page = await pdf.getPage(i + 1);
          const textContent = await page.getTextContent();
          
          let lastY;
          let text = '';
          
          for (let item of textContent.items) {
            if (lastY && lastY - item.transform[5] > 5) {
              // If the vertical position difference is significant, add a new line
              text += '\n\n';
            } else if (text.length > 0 && !text.endsWith(' ')) {
              // Add space between words on the same line
              text += ' ';
            }
            
            text += item.str;
            lastY = item.transform[5];
          }
          
          return text;
        })
      );
  
      const finalText = extractedText.join('\n\n');
      setInput(finalText);
    } catch (error) {
      console.error("Error occurred while extracting text:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileExtension = getFileExtension(file.name);

    reader.onload = ({ target }) => {
      switch (fileExtension) {
        case 'txt':
          setInput(target.result);
          break;
        case 'pdf':
          extractTextFromPDF(target.result);
          break;
        case 'docx':
        case 'doc':
          extractTextFromDocx(target.result);
          break;
        default:
          setInput("Unsupported file type. Only .txt, .pdf, and .docx files are accepted.");
      }
    };

    if (fileExtension === 'txt') {
      reader.readAsText(file);
    } else if (fileExtension === 'pdf') {
      reader.readAsArrayBuffer(file);
    } else if (['docx', 'doc'].includes(fileExtension)) {
      reader.readAsBinaryString(file);
    }
  };

  const handleUpload = () => inputRef.current?.click();

  const convertToBionicText = () => {
    if (input) {
      setOriginalInput(input);
      setOutput(getBionizedTextHTML(input));
    }
  };

  return (
    <div className="bionic-container">
      <div className="b-container">
        <div className="input-section">
          <label>Input</label>
          <div className="text-container-wrapper">
            <textarea
              className="text-container"
              value={input}
              placeholder="Paste your text here."
              onChange={handleInput}
            />
            <div className="floating-buttons left">
              <input
                className="file-input"
                ref={inputRef}
                onChange={handleFileSelect}
                type="file"
              />
              <Button
                type="button"
                className="buttons file-button"
                variant="light"
                onClick={handleUpload}
              >
                Import
              </Button>
            </div>
            <div className="floating-buttons right">
              <Button
                className="buttons convert-button"
                variant="primary"
                onClick={convertToBionicText}
              >
                Convert
              </Button>
            </div>
          </div>
          <p id="filetype-text">
            Supported file types: docx, doc, pdf, txt
          </p>
        </div>
        
        <div className="output-section">
          <label>Output</label>
          <div className="text-container-wrapper">
            <div className="text-container">
              <ReturnBionicText markdown={output} />
            </div>
            <div className="floating-buttons right">
              <PDFDownloadLink
                document={<DownloadPDF text={originalInput} />}
                filename="BionicText"
              >
                {({ loading }) => (
                  <Button
                    className="buttons download-button"
                    variant="success"
                  >
                    {loading ? 'Loading...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BionicConverter;
