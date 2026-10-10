import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Banknote, TrendingDown, CheckCircle } from 'lucide-react'
import { analyzeDrawdown, getDrawdownHistory, executeDrawdown } from '../../lib/api'

export default function CapitalDrawdownPanel({ smeId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getDrawdownHistory(smeId)
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
      await analyzeDrawdown(smeId)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExecute = async (id) => {
    try {
      await executeDrawdown(id)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Autonomous Capital Drawdowns</h3>
          <p className="text-sm text-zinc-400">JIT financing to bridge cash conversion chokepoints.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Banknote className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing Liquidity...' : 'Evaluate Cash Position'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-8 text-center text-zinc-500">No capital drawdowns recorded.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 rounded-xl flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">Liquidity Gap Detected</span>
                  <span className="text-sm text-zinc-300">Repayment via: {item.repayment_source}</span>
                </div>
                <p className="text-sm text-zinc-400 max-w-2xl">{item.trigger_reason}</p>
                <p className="text-xs text-zinc-500 mt-1 italic">Agent Logic: {item.cot_explanation?.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Drawdown Amount</p>
                  <p className="text-xl font-mono font-bold text-white">Rs. {parseFloat(item.drawdown_amount).toLocaleString()}</p>
                </div>
                {item.status === 'proposed' ? (
                  <button onClick={() => handleExecute(item.id)} className="px-3 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg transition-colors font-medium text-sm">
                    Execute
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Executed
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

