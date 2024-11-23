"use client";
import React, { useState } from "react";
import axios from "axios";

const UploadForm = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [author, setAuthor] = useState("");
    const [selectedFile, setSelectedFile] = useState<File>();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadCompleted, setuploadCompleted] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFile(e.target.files[0]);
            setUploadProgress(0);
        }
    };

    const handleUpload = async () => {
        setuploadCompleted(false)
        if (!title || !author) {
            alert("Title and Author are required fields.");
            return;
        }
        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append("filename", title);
                const initializeRes = await axios.post(
                    "http://localhost:8080/upload/initialize",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                const { uploadId } = initializeRes.data;
                console.log("Upload id is ", uploadId);

                const chunkSize = 5 * 1024 * 1024; // 5 MB chunks
                const totalChunks = Math.ceil(selectedFile.size / chunkSize);

                let start = 0;
                const uploadPromises = [];

                for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                    const chunk = selectedFile.slice(start, start + chunkSize);
                    start += chunkSize;
                    const chunkFormData = new FormData();
                    chunkFormData.append("filename", title);
                    chunkFormData.append("chunk", chunk);
                    chunkFormData.append("totalChunks", totalChunks.toString());
                    chunkFormData.append("chunkIndex", chunkIndex.toString());
                    chunkFormData.append("uploadId", uploadId);

                    const uploadPromise = axios.post(
                        "http://localhost:8080/upload",
                        chunkFormData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                            onUploadProgress: (progressEvent) => {
                                const loaded = progressEvent.loaded || 0;
                                const total = progressEvent.total || selectedFile.size;
                                const percentCompleted = Math.round(
                                    (chunkIndex + loaded / total) / 
                                    totalChunks * 
                                    100
                                );
                                setUploadProgress(Math.min(percentCompleted, 100));
                            }
                        }
                    );
                    uploadPromises.push(uploadPromise);
                }

                await Promise.all(uploadPromises);
                const completeRes = await axios.post(
                    "http://localhost:8080/upload/complete",
                    {
                        filename: selectedFile.name,
                        totalChunks: totalChunks,
                        uploadId: uploadId,
                        title: title,
                        description: description,
                        author: author,
                    }
                );

                console.log(completeRes.data);
                setUploadProgress(100);
                setuploadCompleted(true)
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadProgress(0);
        }
    };

    return (
        <div className="container mx-auto max-w-lg p-10">
            <form encType="multipart/form-data">
                <div className="mb-4">
                    <input
                        type="text"
                        name="title"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        name="author"
                        placeholder="Author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        required
                        className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="file"
                        name="file"
                        onChange={handleFileChange}
                        className="px-3 py-2 w-full border rounded-md focus:outline-none focus:border-blue-500"
                    />
                </div>
                {!uploadCompleted ? (<div>{uploadProgress}%</div>):(<div>Completed</div>)}
                {uploadProgress > 0 && (
                    <div>
                        
                        <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5 flex-col">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleUpload}
                    className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                    Upload
                </button>
            </form>
        </div>
    );
};

export default UploadForm;