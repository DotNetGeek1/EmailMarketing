const { useState } = React;

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="bg-white shadow rounded p-4 mb-4">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    {children}
  </div>
);

const CreateCampaignForm: React.FC<{ onOutput: (o: string) => void }> = ({ onOutput }) => {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/campaign?name=${encodeURIComponent(name)}`, { method: 'POST' });
    onOutput(await res.text());
  };

  return (
    <Section title="Create Campaign">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 border rounded p-2" placeholder="Campaign Name" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
      </form>
    </Section>
  );
};

const UploadTemplateForm: React.FC<{ onOutput: (o: string) => void }> = ({ onOutput }) => {
  const [campaignId, setCampaignId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('campaign_id', campaignId);
    if (file) fd.append('file', file);
    const res = await fetch('/template', { method: 'POST', body: fd });
    onOutput(await res.text());
  };

  return (
    <Section title="Upload Template">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
          className="w-full border rounded p-2" placeholder="Campaign ID" />
        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
          className="w-full" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded w-full">Upload</button>
      </form>
    </Section>
  );
};

const SubmitCopyForm: React.FC<{ onOutput: (o: string) => void }> = ({ onOutput }) => {
  const [campaignId, setCampaignId] = useState('');
  const [language, setLanguage] = useState('');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ key, value });
    const res = await fetch(`/copy/${campaignId}/${language}?${params.toString()}`, { method: 'POST' });
    onOutput(await res.text());
  };

  return (
    <Section title="Submit Copy">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
          className="w-full border rounded p-2" placeholder="Campaign ID" />
        <div className="flex space-x-2">
          <input value={language} onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 border rounded p-2" placeholder="Language" />
          <input value={key} onChange={(e) => setKey(e.target.value)}
            className="flex-1 border rounded p-2" placeholder="Key" />
        </div>
        <textarea value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded p-2" placeholder="Value"></textarea>
        <button className="px-4 py-2 bg-blue-600 text-white rounded w-full">Submit</button>
      </form>
    </Section>
  );
};

const GenerateEmailsForm: React.FC<{ onOutput: (o: string) => void }> = ({ onOutput }) => {
  const [campaignId, setCampaignId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/generate/${campaignId}`, { method: 'POST' });
    onOutput(await res.text());
  };

  return (
    <Section title="Generate Emails">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
          className="flex-1 border rounded p-2" placeholder="Campaign ID" />
        <button className="px-4 py-2 bg-green-600 text-white rounded">Generate</button>
      </form>
    </Section>
  );
};

const RunTestsForm: React.FC<{ onOutput: (o: string) => void }> = ({ onOutput }) => {
  const [campaignId, setCampaignId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/test/${campaignId}`, { method: 'POST' });
    onOutput(await res.text());
  };

  return (
    <Section title="Run Tests">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
          className="flex-1 border rounded p-2" placeholder="Campaign ID" />
        <button className="px-4 py-2 bg-purple-600 text-white rounded">Test</button>
      </form>
    </Section>
  );
};

const OutputSection: React.FC<{ text: string }> = ({ text }) => (
  <Section title="Output">
    <pre className="bg-gray-800 text-green-300 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
      {text}
    </pre>
  </Section>
);

const App: React.FC = () => {
  const [output, setOutput] = useState('');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Email Campaign Tool</h1>
        <CreateCampaignForm onOutput={setOutput} />
        <UploadTemplateForm onOutput={setOutput} />
        <SubmitCopyForm onOutput={setOutput} />
        <GenerateEmailsForm onOutput={setOutput} />
        <RunTestsForm onOutput={setOutput} />
        <OutputSection text={output} />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
