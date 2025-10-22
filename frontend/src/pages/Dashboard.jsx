import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [isValid, setIsValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [form, setForm] = useState({ sender: '', receiver: '', amount: '' });

  // Fetch all data on load
  const fetchData = async () => {
    try {
      const [pendingRes, blocksRes, validateRes] = await Promise.all([
        api.get('/transactions/pending'),
        api.get('/blocks'),
        api.get('/blockchain/validate')
      ]);
      setPending(pendingRes.data);
      setBlocks(blocksRes.data);
      setIsValid(validateRes.data.valid);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === Transaction Actions ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.sender === form.receiver) {
      alert('Sender and receiver must be different.');
      return;
    }
    try {
      await api.post('/transaction', {
        sender: form.sender,
        receiver: form.receiver,
        amount: parseFloat(form.amount),
      });
      alert('Transaction created!');
      setForm({ sender: '', receiver: '', amount: '' });
      fetchData(); // Refresh all
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'Invalid input'));
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Cancel this pending transaction?')) return;
    try {
      await api.delete(`/transaction/${id}`);
      alert('Transaction cancelled.');
      fetchData();
    } catch (err) {
      alert('Failed to cancel: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // === Blockchain Actions ===
  const mineBlock = async () => {
    setLoading(true);
    try {
      await api.post('/block/mine');
      alert('Block mined successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Mining failed');
    }
    setLoading(false);
  };

  const validateChain = async () => {
    try {
      const res = await api.get('/blockchain/validate');
      setIsValid(res.data.valid);
      alert(res.data.message);
    } catch (err) {
      setIsValid(false);
      alert('Validation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* Simplified Header (no sidebar needed) */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Blockchain Dashboard</h1>
      </header>

      {/* Chain Status */}
      <div className="flex justify-center mb-8">
        {isValid === true ? (
          <span className="px-6 py-3 bg-green-100 text-green-800 rounded-full font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414l4 4a1 1 0 011.414 0l8-8a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Blockchain is Secure
          </span>
        ) : isValid === false ? (
          <span className="px-6 py-3 bg-red-100 text-red-800 rounded-full font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Chain is Invalid!
          </span>
        ) : (
          <span className="px-6 py-3 bg-gray-100 text-gray-800 rounded-full font-bold">
            Checking Chain Integrity...
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        <button
          onClick={mineBlock}
          disabled={loading}
          className={`${
            loading ? 'bg-yellow-400' : 'bg-yellow-600 hover:bg-yellow-700'
          } text-white font-bold py-3 px-6 rounded-lg transition`}
        >
          {loading ? 'Mining Block...' : 'Mine Block'}
        </button>
        <button
          onClick={validateChain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          Validate Chain
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Transaction Form + Pending List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
                placeholder="Sender (e.g., Alice)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <input
                value={form.receiver}
                onChange={(e) => setForm({ ...form, receiver: e.target.value })}
                placeholder="Receiver (e.g., Bob)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount (e.g., 10.50)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
              >
                Submit Transaction
              </button>
            </form>
          </div>

          {/* Pending Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Transactions</h2>
            {pending.length === 0 ? (
              <p className="text-gray-500 italic">No pending transactions</p>
            ) : (
              <ul className="space-y-3">
                {pending.map((tx) => (
                  <li key={tx.id} className="border border-gray-200 rounded p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{tx.sender} → {tx.receiver}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-semibold">${parseFloat(tx.amount).toFixed(2)}</span>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Blocks Explorer */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Blockchain Explorer</h2>
          {blocks.length === 0 ? (
            <p className="text-gray-500">No blocks mined yet. Click "Mine Block" to create your first block!</p>
          ) : (
            <div className="space-y-5">
              {blocks.map((block) => (
                <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-wrap justify-between items-center mb-3">
                    <h3 className="font-bold text-lg">Block #{block.index_no}</h3>
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                      {block.transactions.length} tx(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Hash</p>
                      <p className="font-mono text-xs bg-white p-2 rounded break-all">{block.current_hash}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Previous Hash</p>
                      <p className="font-mono text-xs bg-white p-2 rounded break-all">{block.previous_hash}</p>
                    </div>
                  </div>
                  <p className="text-sm"><span className="font-medium">Nonce:</span> {block.nonce}</p>
                  <div className="mt-3">
                    <p className="font-medium text-gray-700">Transactions:</p>
                    <ul className="mt-2 space-y-1">
                      {block.transactions.map((tx) => (
                        <li key={tx.id} className="text-sm">
                          <span className="font-medium">{tx.sender} → {tx.receiver}</span> | $
                          {parseFloat(tx.amount).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}