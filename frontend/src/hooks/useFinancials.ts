import { useState, useEffect } from 'react'
import { financialsApi, dcfApi } from '../api/client'
import type { AnnualFinancial, QuarterlyFinancial, DCFAssumption } from '../types'

export function useAnnualFinancials(companyId: number | null) {
  const [data, setData] = useState<AnnualFinancial[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    financialsApi.annual(companyId).then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [companyId])

  return { data, loading }
}

export function useQuarterlyFinancials(companyId: number | null) {
  const [data, setData] = useState<QuarterlyFinancial[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    financialsApi.quarterly(companyId).then((res) => setData(res.data)).finally(() => setLoading(false))
  }, [companyId])

  return { data, loading }
}

export function useDCF(companyId: number | null) {
  const [data, setData] = useState<DCFAssumption | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    dcfApi
      .get(companyId)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [companyId])

  return { data, loading, setData }
}
