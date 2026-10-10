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
