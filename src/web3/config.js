import { http, createConfig } from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const isMainnet = import.meta.env.VITE_NETWORK === 'polygon'
const chain = isMainnet ? polygon : polygonAmoy

const rpcUrl = isMainnet
  ? (import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com')
  : 'https://rpc-amoy.polygon.technology'

export const config = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: {
    [chain.id]: http(rpcUrl),
  },
})
