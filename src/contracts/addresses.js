const isMainnet = import.meta.env.VITE_NETWORK === 'polygon'

export const CHAIN_ID = isMainnet ? 137 : 80002

export const CONTRACTS = isMainnet
  ? {
      YuiToken: import.meta.env.VITE_YUITOKEN_ADDRESS || '',
      MembershipSBT: import.meta.env.VITE_SBT_ADDRESS || '',
    }
  : {
      YuiToken: '0x414e5d24208c394210A1D61D78b2C42125f7f796',
      MembershipSBT: '0x23177541Ce02EE55794523a68616BB9041590e15',
    }

export const EXPLORER_URL = isMainnet
  ? 'https://polygonscan.com'
  : 'https://amoy.polygonscan.com'
