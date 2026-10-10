import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
})

export const calculateFuse = async (sme_id, lender_id) => {
  const response = await api.post('/engine/calculate_fuse', {
    sme_id,
    lender_id
  })
  return response.data
}

export const syncMarketData = async () => {
  const response = await api.get('/market/sync')
  return response.data
}

export const analyzePriceHedge = async (sme_id) => {
  const response = await api.post('/hedge/analyze', { sme_id })
  return response.data
}
export const getHedgeHistory = async (sme_id) => {
  const response = await api.get(`/hedge/history/${sme_id}`)
  return response.data
}
export const applyHedgeAction = async (action_id) => {
  const response = await api.post('/hedge/apply', { action_id })
  return response.data
}

export const analyzeDrawdown = async (sme_id) => {
  const response = await api.post('/capital/analyze', { sme_id })
  return response.data
}
export const getDrawdownHistory = async (sme_id) => {
  const response = await api.get(`/capital/history/${sme_id}`)
  return response.data
}
export const executeDrawdown = async (drawdown_id) => {
  const response = await api.post('/capital/execute', { drawdown_id })
  return response.data
}

export const analyzeArbitrage = async (sme_id) => {
  const response = await api.post('/arbitrage/analyze', { sme_id })
  return response.data
}
export const getArbitrageHistory = async (sme_id) => {
  const response = await api.get(`/arbitrage/history/${sme_id}`)
  return response.data
}
export const executeArbitrage = async (action_id) => {
  const response = await api.post('/arbitrage/execute', { action_id })
  return response.data
}

export const analyzeDiscounts = async (sme_id) => {
  const response = await api.post('/discounts/analyze', { sme_id })
  return response.data
}
export const getDiscountHistory = async (sme_id) => {
  const response = await api.get(`/discounts/history/${sme_id}`)
  return response.data
}
export const executeDiscount = async (action_id) => {
  const response = await api.post('/discounts/execute', { action_id })
  return response.data
}

export const generatePassport = async (sme_id) => {
  const response = await api.post('/passport/generate', { sme_id })
  return response.data
}
export const listPassports = async (sme_id) => {
  const response = await api.get(`/passport/list/${sme_id}`)
  return response.data
}
