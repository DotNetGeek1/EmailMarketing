
const { useState } = React;

const Section = ({ title, children }) => (
  <div className="bg-white shadow rounded p-4 mb-4">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    {children}
  </div>
);

const App = () => {
  const [campaignName, setCampaignName] = useState('');
  const [templateCampaignId, setTemplateCampaignId] = useState('');
  const [templateFile, setTemplateFile] = useState(null);
  const [copyCampaignId, setCopyCampaignId] = useState('');
  const [copyLanguage, setCopyLanguage] = useState('');
  const [copyKey, setCopyKey] = useState('');
  const [copyValue, setCopyValue] = useState('');
  const [generateCampaignId, setGenerateCampaignId] = useState('');
  const [testCampaignId, setTestCampaignId] = useState('');
  const [output, setOutput] = useState('');

  const createCampaign = async (e) => {
    e.preventDefault();
    const res = await fetch(`/campaign?name=${encodeURIComponent(campaignName)}`, { method: 'POST' });
    setOutput(await res.text());
  };

  const uploadTemplate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('campaign_id', templateCampaignId);
    if (templateFile) fd.append('file', templateFile);
    const res = await fetch('/template', { method: 'POST', body: fd });
    setOutput(await res.text());
  };

  const submitCopy = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ key: copyKey, value: copyValue });
    const res = await fetch(`/copy/${copyCampaignId}/${copyLanguage}?${params.toString()}`, { method: 'POST' });
    setOutput(await res.text());
  };

  const generateEmails = async (e) => {
    e.preventDefault();
    const res = await fetch(`/generate/${generateCampaignId}`, { method: 'POST' });
    setOutput(await res.text());
  };

  const runTests = async (e) => {
    e.preventDefault();
    const res = await fetch(`/test/${testCampaignId}`, { method: 'POST' });
    setOutput(await res.text());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Email Campaign Tool</h1>
        <Section title="Create Campaign">
          <form onSubmit={createCampaign} className="flex items-center space-x-2">
            <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
              className="flex-1 border rounded p-2" placeholder="Campaign Name" />
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
          </form>
        </Section>
        <Section title="Upload Template">
          <form onSubmit={uploadTemplate} className="space-y-2">
            <input value={templateCampaignId} onChange={(e) => setTemplateCampaignId(e.target.value)}
              className="w-full border rounded p-2" placeholder="Campaign ID" />
            <input type="file" onChange={(e) => setTemplateFile(e.target.files[0])}
              className="w-full" />
            <button className="px-4 py-2 bg-blue-600 text-white rounded w-full">Upload</button>
          </form>
        </Section>
        <Section title="Submit Copy">
          <form onSubmit={submitCopy} className="space-y-2">
            <input value={copyCampaignId} onChange={(e) => setCopyCampaignId(e.target.value)}
              className="w-full border rounded p-2" placeholder="Campaign ID" />
            <div className="flex space-x-2">
              <input value={copyLanguage} onChange={(e) => setCopyLanguage(e.target.value)}
                className="flex-1 border rounded p-2" placeholder="Language" />
              <input value={copyKey} onChange={(e) => setCopyKey(e.target.value)}
                className="flex-1 border rounded p-2" placeholder="Key" />
            </div>
            <textarea value={copyValue} onChange={(e) => setCopyValue(e.target.value)}
              className="w-full border rounded p-2" placeholder="Value"></textarea>
            <button className="px-4 py-2 bg-blue-600 text-white rounded w-full">Submit</button>
          </form>
        </Section>
        <Section title="Generate Emails">
          <form onSubmit={generateEmails} className="flex items-center space-x-2">
            <input value={generateCampaignId} onChange={(e) => setGenerateCampaignId(e.target.value)}
              className="flex-1 border rounded p-2" placeholder="Campaign ID" />
            <button className="px-4 py-2 bg-green-600 text-white rounded">Generate</button>
          </form>
        </Section>
        <Section title="Run Tests">
          <form onSubmit={runTests} className="flex items-center space-x-2">
            <input value={testCampaignId} onChange={(e) => setTestCampaignId(e.target.value)}
              className="flex-1 border rounded p-2" placeholder="Campaign ID" />
            <button className="px-4 py-2 bg-purple-600 text-white rounded">Test</button>
          </form>
        </Section>
        <Section title="Output">
          <pre className="bg-gray-800 text-green-300 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
            {output}
          </pre>
        </Section>
      </div>
    </div>
  );
};


ReactDOM.createRoot(document.getElementById('root')).render(<App />);
