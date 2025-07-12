import { useState } from 'react';
import '../styles/globals.css';

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    console.log('[AdminUpload] Upload form submitted');
    if (!file) {
      console.warn('[AdminUpload] No file selected');
      setStatus('⚠️ Please select a file.');
      return;
    }

    setStatus('⏳ Uploading…');

    const fd = new FormData();
    fd.append('file', file);
    console.log('[AdminUpload] Sending file to /api/upload');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      console.log('[AdminUpload] Response:', json);
      setStatus(json.message || '✅ Done');
    } catch (err) {
      console.error('[AdminUpload] Error:', err);
      setStatus('❌ Upload failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <h2 className="text-2xl font-bold mb-4 text-center">
        🛠️ Admin Panel: Upload Property DOCX
      </h2>

      <form onSubmit={submit} className="space-y-4">
        <input
          type="file"
          accept=".docx"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-600 file:text-white
                     hover:file:bg-blue-700
                     cursor-pointer"
        />

        <button
          type="submit"
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium"
        >
          🚀 Upload & Index
        </button>
      </form>

      {status && (
        <p className="mt-4 text-center text-sm text-yellow-300">{status}</p>
      )}
    </div>
  );
}
