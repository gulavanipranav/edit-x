import axios from "axios";
import { useState } from "react";
import React from "react";
import {
  EditorState,
  RichUtils,
  convertFromHTML,
  ContentState,
  convertToRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";
import { stateToHTML } from "draft-js-export-html";
import draftToHtml from "draftjs-to-html";
import "./App.css"
import createImagePlugin from '@draft-js-plugins/image';
import Editor from '@draft-js-plugins/editor';
import '@draft-js-plugins/image/lib/plugin.css';



function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorState, setEditorState] = React.useState(() =>
    EditorState.createEmpty()
  );

  const imagePlugin = createImagePlugin();
  const onChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      onChange(newState);
      return "handled";
    }

    return "not-handled";
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  const handleDownload = async () => {
    console.log("clicked");
    try {
      const contentState = editorState.getCurrentContent();
      let htmlContent = stateToHTML(contentState);
      const rawContentState = convertToRaw(editorState.getCurrentContent());
      const markup = draftToHtml(rawContentState);
      console.log(rawContentState, markup, htmlContent);
      htmlContent = `<!DOCTYPE html>
      <html>
        <head>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>`;
      const response = await axios.post(
        "http://localhost:3001/convert",
        { htmlContent },
        { responseType: "blob" }
      );
      console.log(response);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "document.docx";
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();

      console.log(formData, "init", selectedFile);

      formData.append("file", selectedFile);

      console.log(formData.getAll("file"), "form data after append");

      const response = await axios.post(
        "http://localhost:3001/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response)
      const blocksFromHTML = convertFromHTML(response.data.html);
      const state = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      setEditorState(EditorState.createWithContent(state));
      console.log(response); // Handle the response from the server
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex h-16 items-center  p-6 text-2xl text-black border-b-2">
        <div>Edit-x</div>
      </div>
      <div className="h-[94vh]">
        <div className="flex h-full">
          <div className="h-full scroll-auto px-6 mt-4 w-[25%]">
            <input
              className="block w-full text-sm text-slate-500
              file:mr-4 file:rounded file:border
               file:bg-black file:px-4
              file:py-2 file:text-sm
                file:font-semibold file:text-white
              "
              type="file"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="w-full mt-2 rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 "
              onClick={handleUpload}
            >
              Upload
            </button>
          </div>
          <div className="w-full scroll-auto h-full bg-gray-200">
            <div className="flex w-full justify-end bg-gray-800 p-3">
              <button
                type="button"
                className="rounded border bg-white px-6 py-2 text-black"
                onClick={handleDownload}
              >
                Downlaod
              </button>
            </div>
            <div className="mx-auto my-4 h-[94%]  bg-white w-[210mm] border">
              <Editor
                editorState={editorState}
                onChange={setEditorState}
                handleKeyCommand={handleKeyCommand}
                plugins={[imagePlugin]}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
