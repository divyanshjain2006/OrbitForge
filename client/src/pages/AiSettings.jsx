import { useState, useEffect } from 'react';
import { 
  getAiProviders, addAiProvider, removeAiProvider, testAiProvider, 
  getAiRoles, updateAiRole 
} from '../services/api';

const AVAILABLE_PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'claude', name: 'Anthropic Claude' },
  { id: 'openrouter', name: 'OpenRouter' }
];

const ROLES = [
  { id: 'SCIENTIFIC_EXPLAINER', name: 'Scientific Explainer' },
  { id: 'RESEARCH_ASSISTANT', name: 'Research Assistant' },
  { id: 'MISSION_ANALYST', name: 'Mission Analyst' },
  { id: 'DECISION_REVIEWER', name: 'Decision Reviewer' },
  { id: 'SCENARIO_ANALYST', name: 'Scenario Analyst' }
];

export default function AiSettings() {
  const [providers, setProviders] = useState([]);
  const [rolesConfig, setRolesConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newProviderId, setNewProviderId] = useState('openai');
  const [newProviderKey, setNewProviderKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState({ provider: null, status: null, message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const provRes = await getAiProviders();
      setProviders(provRes.providers || []);
      
      const rolesRes = await getAiRoles();
      const roleMap = {};
      (rolesRes.roles || []).forEach(r => {
        roleMap[r.role] = r;
      });
      setRolesConfig(roleMap);
    } catch (err) {
      setError(err.message || 'Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await addAiProvider(newProviderId, newProviderKey);
      setNewProviderKey('');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to connect provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (provider) => {
    setTestResult({ provider, status: 'testing', message: 'Testing connection...' });
    try {
      const res = await testAiProvider(provider);
      setTestResult({ provider, status: 'success', message: res.message || 'Connection successful' });
      await fetchData(); // Refresh lastTestedAt
    } catch (err) {
      setTestResult({ provider, status: 'error', message: err.message || 'Connection failed' });
    }
  };

  const handleRemove = async (provider) => {
    const isUsed = Object.values(rolesConfig).some(r => r.provider === provider);
    if (isUsed) {
      if (!window.confirm(`This provider is currently assigned to one or more AI roles. Removing it will make those roles unavailable until another provider is configured. Continue?`)) {
        return;
      }
    }
    
    try {
      await removeAiProvider(provider);
      setTestResult({ provider: null, status: null, message: '' });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to remove provider');
    }
  };

  const handleRoleChange = async (roleId, field, value) => {
    const currentConfig = rolesConfig[roleId] || { provider: 'openai', model: '' };
    const newConfig = { ...currentConfig, [field]: value };
    
    try {
      await updateAiRole(roleId, newConfig.provider, newConfig.model || 'default-model');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading AI settings...</div>;

  const connectedProviderIds = providers.map(p => p.provider);
  const unconnectedProviders = AVAILABLE_PROVIDERS.filter(p => !connectedProviderIds.includes(p.id));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>AI Providers &amp; Models</h1>
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
      
      <section style={{ marginBottom: '3rem', background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Connected Providers</h2>
        
        {providers.length === 0 ? (
          <p style={{ color: '#666' }}>No AI providers connected. Connect an AI provider to enable OrbitForge AI assistance.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {providers.map(p => {
              const provInfo = AVAILABLE_PROVIDERS.find(ap => ap.id === p.provider);
              return (
                <li key={p.provider} style={{ borderBottom: '1px solid #eee', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{provInfo ? provInfo.name : p.provider}</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#555' }}>
                      <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Connected</span>
                      <span>Key: ••••••••••••</span>
                      {p.lastTestedAt && <span>Last tested: {new Date(p.lastTestedAt).toLocaleString()}</span>}
                    </div>
                    {testResult.provider === p.provider && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: testResult.status === 'success' ? 'green' : (testResult.status === 'error' ? 'red' : 'blue') }}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleTest(p.provider)} style={{ padding: '0.5rem 1rem', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Test Connection</button>
                    <button onClick={() => handleRemove(p.provider)} style={{ padding: '0.5rem 1rem', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {unconnectedProviders.length > 0 && (
        <section style={{ marginBottom: '3rem', background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Connect New Provider</h2>
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Provider</label>
              <select 
                value={newProviderId} 
                onChange={(e) => setNewProviderId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                {unconnectedProviders.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>API Key</label>
              <input 
                type="password" 
                value={newProviderKey}
                onChange={(e) => setNewProviderKey(e.target.value)}
                placeholder="Enter your API key"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isSubmitting ? 'Connecting...' : 'Save Provider'}
            </button>
          </form>
        </section>
      )}

      <section style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>AI Role Configuration</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Assign connected providers and models to specific OrbitForge AI roles.</p>
        
        {providers.length === 0 ? (
          <div style={{ padding: '1rem', background: '#fff3cd', color: '#856404', borderRadius: '4px' }}>
            Please connect at least one AI provider above to configure roles.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {ROLES.map(role => {
              const currentConfig = rolesConfig[role.id] || { provider: '', model: '' };
              
              return (
                <div key={role.id} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{role.name}</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#555' }}>Provider</label>
                      <select 
                        value={currentConfig.provider}
                        onChange={(e) => handleRoleChange(role.id, 'provider', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      >
                        <option value="" disabled>Select a connected provider</option>
                        {providers.map(p => {
                          const provInfo = AVAILABLE_PROVIDERS.find(ap => ap.id === p.provider);
                          return (
                            <option key={p.provider} value={p.provider}>{provInfo ? provInfo.name : p.provider}</option>
                          );
                        })}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: '#555' }}>Model</label>
                      <input 
                        type="text" 
                        value={currentConfig.model}
                        onChange={(e) => {
                          // local state update for typing
                          setRolesConfig(prev => ({
                            ...prev,
                            [role.id]: { ...prev[role.id], model: e.target.value }
                          }));
                        }}
                        onBlur={(e) => handleRoleChange(role.id, 'model', e.target.value)}
                        placeholder="e.g. gpt-4o, gemini-1.5-pro"
                        disabled={!currentConfig.provider}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
