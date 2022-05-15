import { useCallback, useMemo } from 'react'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import BigNumber from 'bignumber.js'

import { useTransactionAdder } from 'state/transactions/hooks'
import { veNFTType } from 'pages/vote'

import useWeb3React from './useWeb3'
import { useBaseV1VoterContract, useVaultContract } from './useContract'
import { calculateGasMargin } from 'utils/web3'

export type VoteType = { address: string; amount: number }

export enum VoteCallBackState {
  INVALID = 'INVALID',
  VALID = 'VALID',
}

export default function useVoteCallback(
  votes: VoteType[],
  tokenID: BigNumber | null,
  NFTType: veNFTType | null
): { state: VoteCallBackState; callback: null | (() => Promise<string>); error: string | null } {
  const { chainId, account, library } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const baseVoter = useBaseV1VoterContract()
  const vaultContract = useVaultContract()

  const constructCall = useCallback(() => {
    try {
      const tokens = votes.map((vote) => vote.address)
      const amounts = votes.map((vote) => new BigNumber(vote.amount * 10 ** 5).toString())

      const args = NFTType !== veNFTType.USER_WALLET_NFT ? [tokens, amounts] : [tokenID?.toString(), tokens, amounts]
      const methodName = NFTType !== veNFTType.USER_WALLET_NFT ? 'lock' : 'vote'

      console.log({ args, methodName })

      if (!account || !chainId || !library || !baseVoter || !vaultContract || !NFTType) {
        throw new Error('Missing dependencies.')
      }
      if (NFTType)
        return {
          address: vaultContract.address,
          calldata: vaultContract.interface.encodeFunctionData(methodName, args) ?? '',
          value: 0,
        }
      return {
        address: baseVoter.address,
        calldata: baseVoter.interface.encodeFunctionData(methodName, args) ?? '',
        value: 0,
      }
    } catch (error) {
      return { error }
    }
  }, [votes, tokenID, NFTType, vaultContract, baseVoter, account, chainId, library])

  return useMemo(() => {
    if (!vaultContract || !baseVoter || !tokenID || !votes.length || !account || !chainId || !library) {
      return {
        state: VoteCallBackState.INVALID,
        callback: null,
        error: 'Missing dependencies',
      }
    }

    return {
      state: VoteCallBackState.VALID,
      error: null,
      callback: async function onVote(): Promise<string> {
        console.log('onVote callback')
        const call = constructCall()
        const { address, calldata, value } = call

        if ('error' in call) {
          console.error(call.error)
          if (call.error.message) {
            throw new Error(call.error.message)
          } else {
            throw new Error('Unexpected error. Could not construct calldata.')
          }
        }

        const tx = !value
          ? { from: account, to: address, data: calldata }
          : { from: account, to: address, data: calldata, value }

        const estimatedGas = await library.estimateGas(tx).catch((gasError) => {
          console.debug('Gas estimate failed, trying eth_call to extract error', call)

          return library
            .call(tx)
            .then((result) => {
              console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
              return {
                error: new Error('Unexpected issue with estimating the gas. Please try again.'),
              }
            })
            .catch((callError) => {
              console.debug('Call threw an error', call, callError)
              return {
                error: new Error(callError.message), // TODO make this human readable
              }
            })
        })

        if ('error' in estimatedGas) {
          throw new Error('Unexpected error. Could not estimate gas for this transaction.')
        }

        return library
          .getSigner()
          .sendTransaction({
            ...tx,
            ...(estimatedGas ? { gasLimit: calculateGasMargin(estimatedGas) } : {}),
            // gasPrice /// TODO add gasPrice based on EIP 1559
          })
          .then((response: TransactionResponse) => {
            console.log(response)

            const summary = 'Vote with veNFT#' + tokenID

            addTransaction(response, { summary })

            return response.hash
          })
          .catch((error) => {
            // if the user rejected the tx, pass this along
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              // otherwise, the error was unexpected and we need to convey that
              console.error(`Transaction failed`, error, address, calldata, value)
              throw new Error(`Transaction failed: ${error.message}`)
            }
          })
      },
    }
  }, [votes, baseVoter, vaultContract, NFTType, tokenID, account, chainId, library])
}
