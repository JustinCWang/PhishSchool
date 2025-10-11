import './Learn.css'

export default function Learn() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Learn</h1>
      <p className="text-gray-600">You will see practice emails here. For now, here's a placeholder card with a sample email body and controls.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Practice Email #1</h2>
          <p className="mt-2 text-sm text-gray-700">Subject: Action Required - Verify Your Account</p>
        </div>
        <div className="mb-4 rounded-md bg-gray-50 p-4 text-sm text-gray-800">Hello, your account requires verification. Click the link below to proceed to secure your account now.</div>
        <div className="flex gap-3">
          <button className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">Not Phishing</button>
          <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">Phishing</button>
        </div>
      </div>
    </div>
  )
}
