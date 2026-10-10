import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react'
import { analyzePriceHedge, getHedgeHistory, applyHedgeAction } from '../../lib/api'

export default function PriceHedgePanel({ smeId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHedgeHistory(smeId)
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
      await analyzePriceHedge(smeId)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApply = async (id) => {
    try {
      await applyHedgeAction(id)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Parametric Dynamic Pricing</h3>
          <p className="text-sm text-zinc-400">Automated storefront price hedging based on raw material costs.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Scanning Markets...' : 'Analyze Market Impact'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-8 text-center text-zinc-500">No price hedge actions recorded.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 rounded-xl flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-emerald-400">{item.ticker}</span>
                  <span className="text-sm text-zinc-300">Detected Cost Change: <span className={item.price_change_pct > 0 ? 'text-red-400' : 'text-emerald-400'}>{item.price_change_pct.toFixed(2)}%</span></span>
                </div>
                <p className="text-sm text-zinc-400 max-w-2xl">{item.cot_explanation?.reason}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Recommended Price Adj.</p>
                  <p className="text-lg font-mono font-bold text-white">{item.recommended_adjustment_pct > 0 ? '+' : ''}{item.recommended_adjustment_pct.toFixed(2)}%</p>
                </div>
                {item.status === 'pending' ? (
                  <button onClick={() => handleApply(item.id)} className="p-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors">
                    <ShieldAlert className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="p-2 text-emerald-500"><CheckCircle className="w-5 h-5" /></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

