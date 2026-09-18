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
    const currentConfig = rolesConfig[roleId] || { provider: 'openai', model: '', apiKey: '' };
    const newConfig = { ...currentConfig, [field]: value };
    
    // Don't save if it's just the API key being cleared locally
    if (field === 'apiKey' && !value) return;

    const defaultModels = {
      openai: "gpt-4o-mini",
      gemini: "gemini-flash-latest",
      claude: "claude-3-haiku-20240307",
      openrouter: "meta-llama/llama-3-8b-instruct:free"
    };
    const finalModel = newConfig.model || defaultModels[newConfig.provider] || "gpt-4o-mini";

    try {
      await updateAiRole(roleId, newConfig.provider, finalModel, newConfig.apiKey);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update role');
    }
  };

  if (loading) return <div className="loading-state">Loading AI settings...</div>;

  const connectedProviderIds = providers.map(p => p.provider);
  const unconnectedProviders = AVAILABLE_PROVIDERS.filter(p => !connectedProviderIds.includes(p.id));

  return (
    <div className="ai-settings-container">
      <header className="ai-settings-header">
        <h1 className="ai-settings-title">AI Providers &amp; Models</h1>
        <p className="ai-settings-subtitle">Manage your connections to external language models.</p>
      </header>
      
      {error && <div className="ai-alert-error">{error}</div>}
      <section className="ai-settings-section">
        <h2 className="ai-settings-section-title">Connected Providers</h2>
        
        {providers.length === 0 ? (
          <div className="ai-settings-card">
            <p className="text-muted">No AI providers connected. Connect an AI provider to enable OrbitForge AI assistance.</p>
          </div>
        ) : (
          <ul className="ai-connected-list">
            {providers.map(p => {
              const provInfo = AVAILABLE_PROVIDERS.find(ap => ap.id === p.provider);
              return (
                <li key={p.provider} className="ai-connected-item">
                  <div className="ai-provider-info">
                    <h3 className="ai-provider-name">{provInfo ? provInfo.name : p.provider}</h3>
                    <div className="ai-provider-meta">
                      <span className="ai-status-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Connected
                      </span>
                      <span>Key: ••••••••••••</span>
                      {p.lastTestedAt && <span>Last tested: {new Date(p.lastTestedAt).toLocaleString()}</span>}
                    </div>
                    {testResult.provider === p.provider && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: testResult.status === 'success' ? 'var(--success)' : (testResult.status === 'error' ? 'var(--danger)' : 'var(--accent)') }}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                  <div className="ai-actions">
                    <button onClick={() => handleTest(p.provider)} className="ai-btn-test">Test Connection</button>
                    <button onClick={() => handleRemove(p.provider)} className="ai-btn-remove">Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {unconnectedProviders.length > 0 && (
        <section className="ai-settings-section">
          <h2 className="ai-settings-section-title">Connect New Provider</h2>
          <div className="ai-settings-card">
            <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
              <div className="ai-form-group">
                <label className="ai-label">Provider</label>
                <select 
                  value={newProviderId} 
                  onChange={(e) => setNewProviderId(e.target.value)}
                  className="ai-select"
                >
                  {unconnectedProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="ai-form-group">
                <label className="ai-label">API Key</label>
                <input 
                  type="password" 
                  value={newProviderKey}
                  onChange={(e) => setNewProviderKey(e.target.value)}
                  placeholder="Enter your API key"
                  required
                  className="ai-input"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="ai-btn-primary" style={{ alignSelf: 'flex-start' }}>
                {isSubmitting ? 'Connecting...' : 'Save Provider'}
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="ai-settings-section">
        <h2 className="ai-settings-section-title">AI Role Configuration</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Assign specific providers and models to OrbitForge AI roles.</p>
        
        <div className="ai-role-grid">
          {ROLES.map(role => {
            const currentConfig = rolesConfig[role.id] || { provider: '', model: '', apiKey: '' };
            
            return (
              <div key={role.id} className="ai-settings-card ai-role-card">
                <header className="ai-role-header">
                  <h3 className="ai-role-name">{role.name}</h3>
                </header>
                
                <div className="ai-form-group">
                  <label className="ai-label">Provider</label>
                  <select 
                    value={currentConfig.provider}
                    onChange={(e) => handleRoleChange(role.id, 'provider', e.target.value)}
                    className="ai-select"
                  >
                    <option value="" disabled>Select a provider</option>
                    {AVAILABLE_PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="ai-form-group">
                  <label className="ai-label">Model</label>
                  <input 
                    type="text" 
                    value={currentConfig.model || ''}
                    onChange={(e) => {
                      setRolesConfig(prev => ({
                        ...prev,
                        [role.id]: { ...prev[role.id], model: e.target.value }
                      }));
                    }}
                    onBlur={(e) => handleRoleChange(role.id, 'model', e.target.value)}
                    placeholder="e.g. gpt-4o"
                    disabled={!currentConfig.provider}
                    className="ai-input"
                  />
                </div>
                
                <div className="ai-form-group">
                  <label className="ai-label">API Key Override</label>
                  <input 
                    type="password" 
                    value={currentConfig.apiKey || ''}
                    onChange={(e) => {
                      setRolesConfig(prev => ({
                        ...prev,
                        [role.id]: { ...prev[role.id], apiKey: e.target.value }
                      }));
                    }}
                    onBlur={(e) => {
                      if (e.target.value) {
                        handleRoleChange(role.id, 'apiKey', e.target.value);
                      }
                    }}
                    placeholder="Leave blank to use global"
                    disabled={!currentConfig.provider}
                    className="ai-input"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
