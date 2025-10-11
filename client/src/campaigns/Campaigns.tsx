export default function Campaigns() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Campaigns</h1>
      <p className="text-gray-600">Opt-in to receive test phishing emails and track your progress over time.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            I want to receive periodic test phishing emails
          </label>
          <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save Preferences</button>
        </form>
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Your Performance</h2>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">No data yet. Complete some tests to see your stats here.</div>
        </div>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}
