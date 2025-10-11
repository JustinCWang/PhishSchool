export default function Detector() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detector</h1>
      <p className="text-gray-600">Upload an .eml file. We will parse and score it.</p>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form className="space-y-4">
          <input type="file" accept=".eml" className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Analyze</button>
        </form>
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-700">Score: — (placeholder)</div>
      </div>
    </div>
  )
}
