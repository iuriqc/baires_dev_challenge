'use client'

import { useState } from 'react'
import { Paperclip } from 'lucide-react'

export default function FileUploadTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('🔍 File selected:', file)
    setSelectedFile(file || null)
    setUploadStatus(file ? `Selected: ${file.name} (${file.size} bytes)` : 'No file selected')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('No file selected')
      return
    }

    setUploadStatus('Uploading...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('room_id', 'test-room')
      formData.append('user_id', 'test-user')

      console.log('📤 Testing upload to:', process.env.NEXT_PUBLIC_API_URL)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Upload successful:', data)
        setUploadStatus(`Upload successful! URL: ${data.file_url}`)
      } else {
        const error = await response.text()
        console.error('❌ Upload failed:', error)
        setUploadStatus(`Upload failed: ${error}`)
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      setUploadStatus(`Upload error: ${error}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">File Upload Test</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </label>
          <span className="text-sm text-gray-600">Click to select file</span>
        </div>

        {selectedFile && (
          <div className="text-sm">
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {selectedFile.size} bytes</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="btn btn-primary btn-sm disabled:opacity-50"
        >
          Test Upload
        </button>

        {uploadStatus && (
          <div className="text-sm p-2 bg-gray-100 rounded">
            <strong>Status:</strong> {uploadStatus}
          </div>
        )}
      </div>
    </div>
  )
} 