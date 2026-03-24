import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

export function fetchMetrics(range) {
  return api.get('/metrics', { params: { range } }).then((r) => r.data)
}

export function fetchCommands(range) {
  return api.get('/commands', { params: { range } }).then((r) => r.data)
}

export function fetchTimeseries(range) {
  return api.get('/timeseries', { params: { range } }).then((r) => r.data)
}

export function fetchErrors(range) {
  return api.get('/errors', { params: { range } }).then((r) => r.data)
}

export function fetchInteractionTypes(range) {
  return api.get('/interaction-types', { params: { range } }).then((r) => r.data)
}

export function fetchRecent() {
  return api.get('/recent').then((r) => r.data)
}

export function fetchHeatmap(range) {
  return api.get('/heatmap', { params: { range } }).then((r) => r.data)
}
