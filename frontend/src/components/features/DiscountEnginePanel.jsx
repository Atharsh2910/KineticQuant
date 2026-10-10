import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Percent, CheckCircle, Send } from 'lucide-react'
import { analyzeDiscounts, getDiscountHistory, executeDiscount } from '../../lib/api'

export default function DiscountEnginePanel({ smeId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getDiscountHistory(smeId)
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
      await analyzeDiscounts(smeId)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExecute = async (id) => {
    try {
      await executeDiscount(id)
      await fetchHistory()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Automated Early Payment Discounts</h3>
          <p className="text-sm text-slate-400">Dynamic AP/AR discounting to optimize working capital.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Percent className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Evaluating Ledgers...' : 'Run Discount Engine'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-500">No discount actions recorded.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.direction === 'AR' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {item.direction === 'AR' ? 'Offer Discount to Buyer' : 'Request Discount from Supplier'}
                  </span>
                  {item.status !== 'proposed' && (
                    <span className="text-emerald-500"><CheckCircle className="w-4 h-4" /></span>
                  )}
                </div>
                <h4 className="text-white font-medium mb-1">{item.counterparty_name}</h4>
                <p className="text-xs text-slate-400 italic mb-4">{item.cot_explanation?.reason}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-900/50 p-2 rounded">
                    <p className="text-xs text-slate-500">Original Invoice</p>
                    <p className="font-mono text-sm text-slate-300">${parseFloat(item.original_amount).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded">
                    <p className="text-xs text-slate-500">Discount ({item.discount_pct.toFixed(1)}%)</p>
                    <p className="font-mono text-sm text-emerald-400">${parseFloat(item.discounted_amount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-xs text-slate-500">Ann. Yield</p>
                  <p className="font-mono text-sm text-purple-400">{item.annualized_yield?.toFixed(2)}%</p>
                </div>
                {item.status === 'proposed' && (
                  <button onClick={() => handleExecute(item.id)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors font-medium text-sm">
                    <Send className="w-3 h-3" /> Execute
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

