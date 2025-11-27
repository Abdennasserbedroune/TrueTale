'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CreateBookPage() {
  const router = useRouter();
  const [step, setStep] = useState<'basic' | 'files'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookId, setBookId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceCents: 0,
    tags: [] as string[],
    isDraft: true,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create book');
      }

      const data = await res.json();
      setBookId(data._id);
      setStep('files');
    } catch (err: any) {
      setError(err.message || 'Failed to create book');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Book</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {step === 'basic' && (
        <form onSubmit={handleCreateBook} className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Book title"
              required
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="About your book"
              className="w-full px-4 py-2 border rounded"
              rows={6}
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.priceCents / 100}
              onChange={(e) =>
                setFormData({ ...formData, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })
              }
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="fantasy, sci-fi, romance"
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value.split(',').map((t) => t.trim()) })
              }
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDraft}
              onChange={(e) => setFormData({ ...formData, isDraft: e.target.checked })}
              id="isDraft"
            />
            <label htmlFor="isDraft">Save as draft</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Book'}
          </button>
        </form>
      )}

      {step === 'files' && <BookFileUpload bookId={bookId} />}
    </div>
  );
}

function BookFileUpload({ bookId }: { bookId: string }) {
  const [uploading, setUploading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Get presigned URL
      const urlRes = await fetch(`${API_URL}/api/books/${bookId}/file-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (!urlRes.ok) throw new Error('Failed to get upload URL');

      const urlData = await urlRes.json();

      // Upload to S3
      await fetch(urlData.presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });

      // Add file metadata
      await fetch(`${API_URL}/api/books/${bookId}/files`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          fileId: urlData.fileId,
          type: 'pdf', // Simplified - should detect from filename
          size: selectedFile.size,
        }),
      });

      alert('File uploaded successfully');
    } catch (err) {
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border p-6 rounded text-center">
      <h2 className="text-xl font-bold mb-4">Upload Files</h2>
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        accept=".pdf,.epub,.mobi"
        className="w-full"
      />
      <p className="text-gray-600 mt-2">Supported: PDF, EPUB, MOBI</p>
      {uploading && <p className="text-blue-600 mt-2">Uploading...</p>}
    </div>
  );
}
