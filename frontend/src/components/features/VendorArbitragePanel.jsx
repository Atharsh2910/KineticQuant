import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, GitMerge, CheckCircle } from 'lucide-react'
import { analyzeArbitrage, getArbitrageHistory, executeArbitrage } from '../../lib/api'

export default function VendorArbitragePanel({ smeId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getArbitrageHistory(smeId)
      setHistory(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [smeId])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      await analyzeArbitrage(smeId)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExecute = async (id) => {
    try {
      await executeArbitrage(id)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Multi-Vendor Inventory Arbitrage</h3>
          <p className="text-sm text-slate-400">Agentic procurement routing based on global pricing and freight data.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Globe className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Scanning Suppliers...' : 'Find Arbitrage Opportunities'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-500">No vendor arbitrage actions recorded.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{item.commodity}</span>
                    <span className="text-slate-500 text-sm">Shift to</span>
                    <span className="text-indigo-400 font-medium">{item.alternative_vendor}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic max-w-2xl">LangChain Agent: {item.agent_reasoning?.reason}</p>
                </div>
                {item.status === 'proposed' ? (
                  <button onClick={() => handleExecute(item.id)} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors font-medium text-sm flex items-center gap-2">
                    <GitMerge className="w-4 h-4" /> Reroute {item.recommended_volume_shift_pct.toFixed(0)}% Vol
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Executed
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Primary Cost</p>
                  <p className="text-sm font-mono text-slate-300">${item.primary_unit_cost}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Alternative Cost</p>
                  <p className="text-sm font-mono text-emerald-400">${item.alternative_unit_cost}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Potential Savings</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">+{item.potential_savings_pct.toFixed(2)}%</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

