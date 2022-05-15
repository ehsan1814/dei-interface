import BigNumber from 'bignumber.js'

import { usePlatformVoterContract } from './useContract'
import { useSingleContractMultipleMethods } from 'state/multicall/hooks'
import { useSearch } from 'components/App/Liquidity'

export type preVoteType = { address: string; amount: number; symbol: string | null }

export function usePreVotedPairs(): preVoteType[] {
  const { solidlyPairs } = useSearch()
  const baseVoterContract = usePlatformVoterContract()

  const calls = [
    { methodName: 'getVotes', callInputs: [] },
    { methodName: 'voteShare', callInputs: [] },
  ]
  const [votes, shares] = useSingleContractMultipleMethods(baseVoterContract, calls)
  if (!votes || !shares || !votes.result?.length || !shares.result?.length) return []

  const preVotesAddress = votes.result[0]
  const preVotesRatio = votes.result[1]
  const voteShare = shares.result[0]

  let totalVoteWeight = new BigNumber(0)
  for (let index = 0; index < preVotesRatio.length; index++) {
    totalVoteWeight = totalVoteWeight.plus(preVotesRatio[index].toNumber())
  }
  const preVotedPairs = []
  for (let index = 0; index < preVotesAddress.length; index++) {
    const address = preVotesAddress[index]
    const pairIndex = solidlyPairs.findIndex((pair) => pair.id.toLowerCase() === address.toLowerCase())
    const symbol =
      pairIndex > -1 ? `${solidlyPairs[pairIndex].token0.symbol}/${solidlyPairs[pairIndex].token1.symbol}` : null

    const amount = (preVotesRatio[index].toNumber() / totalVoteWeight.toNumber()) * voteShare.toNumber()
    preVotedPairs.push({ address, amount, symbol })
  }

  return preVotedPairs
}
