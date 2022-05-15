import React, { useState, useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { BigNumber as BigNumberEther } from '@ethersproject/bignumber'

import { SolidlyPair } from 'apollo/queries'
import Hero, { HeroSubtext } from 'components/Hero'
import { useSearch, SearchField } from 'components/App/Liquidity'
import Disclaimer from 'components/Disclaimer'
import { Table, VotingPower } from 'components/App/Vote'
import Dropdown from 'components/Dropdown'
import { RowBetween } from 'components/Row'
import useVoteCallback, { VoteType } from 'hooks/useVoteCallback'
import { useUserVotes } from 'hooks/useUserVotes'
import { useVeNFTTokens, useFSolidWithdrawData } from 'hooks/useVeNFT'
import { preVoteType, usePreVotedPairs } from 'hooks/usePreVotedPairs'
import { useRouter } from 'next/router'
import useWeb3React from 'hooks/useWeb3'

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  overflow: visible;
  margin: 0 auto;
`

const Wrapper = styled(Container)`
  margin: 0 auto;
  margin-top: 50px;
  width: clamp(250px, 90%, 1400px);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-top: 20px;
  `}
`

const UpperRow = styled(RowBetween)`
  gap: 10px;
  margin-bottom: 10px;
  height: 50px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
      display: flex;
      justify-content:center;
      flex-direction:column;
    `}

  & > * {
    height: 100%;
    max-width: fit-content;

    &:first-child {
      max-width: 400px;
      margin-right: auto;
    }
  }
`
export enum veNFTType {
  USER_WALLET_NFT = 'USER_WALLET_NFT',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
}

export default function Vote() {
  const { chainId, account } = useWeb3React()
  const [selectedTokenID, setSelectedTokenID] = useState<BigNumber | null>(null)
  // this array, save pairs, must have a vote
  const [preVotedPairs, setPreVotedPairs] = useState<preVoteType[]>([])
  // this is user votes
  const [votes, setVotes] = useState<VoteType[]>([])
  // this is for save drop down default value
  const [dropDownDefaultValue, setDropDownDefaultValue] = useState('0')
  // save type of veNFT
  const [selectedVeNFTType, setSelectedVeNFTType] = useState<veNFTType | null>(null)
  const [loading, setLoading] = useState(false)

  const { snapshot, searchProps } = useSearch()
  const { veNFTTokenIds } = useVeNFTTokens()
  const { useLockPendingTokenId, userTokenId } = useFSolidWithdrawData()
  const { callback } = useVoteCallback(votes, selectedTokenID, selectedVeNFTType)
  const preVoted = usePreVotedPairs()
  const userVotes = useUserVotes(selectedTokenID)
  const router = useRouter()
  const {
    query: { tokenId },
  } = useRouter()

  // console.log({ veNFTTokenIds })
  // console.log({ useLockPendingTokenId, userTokenId })

  const onCastVote = useCallback(async () => {
    if (!callback) return

    let error = ''
    try {
      const txHash = await callback()
      console.log(txHash)
    } catch (e) {
      if (e instanceof Error) {
        error = e.message
      } else {
        console.error(e)
        error = 'An unknown error occurred.'
      }
    }
    setLoading(false)
  }, [callback])

  const dropdownOnSelect = useCallback(
    (val: string) => {
      const index = parseInt(val, 10)
      const veNFTTokenIdsLength = veNFTTokenIds.length
      // router.push(`/vote?tokenId=${}`)
      if (index == veNFTTokenIdsLength) {
        setSelectedVeNFTType(veNFTType.PENDING)
        setDropDownDefaultValue(val)
        // router.push(`/vote?tokenId=${useLockPendingTokenId.toString()}`)
        setSelectedTokenID(new BigNumber(useLockPendingTokenId.toString()))
        return
      } else if (index == veNFTTokenIdsLength + 1) {
        setSelectedVeNFTType(veNFTType.LOCKED)
        setDropDownDefaultValue(val)
        // router.push(`/vote?tokenId=${userTokenId.toString()}`)
        setSelectedTokenID(new BigNumber(userTokenId.toString()))
        return
      }
      setSelectedVeNFTType(veNFTType.USER_WALLET_NFT)
      setDropDownDefaultValue(val)
      // router.push(`/vote?tokenId=${veNFTTokenIds[index].toString()}`)
      setSelectedTokenID(new BigNumber(veNFTTokenIds[index].toString()))
      return
    },
    [JSON.stringify(veNFTTokenIds), useLockPendingTokenId, userTokenId] // eslint-disable-line
  )

  // TODO: fix eslint warning. we should change JSON.stringify for preventing side effect
  useEffect(() => {
    setPreVotedPairs(preVoted)
  }, [JSON.stringify(preVoted)]) // eslint-disable-line

  // TODO: fix eslint warning. we should change JSON.stringify for preventing side effect
  useEffect(() => {
    if (selectedVeNFTType == veNFTType.PENDING) setVotes([...preVotedPairs, ...userVotes])
    else setVotes(userVotes)
  }, [JSON.stringify(userVotes), selectedTokenID, preVotedPairs, selectedVeNFTType]) // eslint-disable-line

  // TODO: fix eslint warning. we should change JSON.stringify for preventing side effect
  useEffect(() => {
    if (!account || !chainId || !tokenId || !useLockPendingTokenId || !userTokenId) return
    const veNFTs: BigNumberEther[] = [...veNFTTokenIds, useLockPendingTokenId, userTokenId]
    const paramTokenId = new BigNumber(tokenId?.toString())
    console.log({ paramTokenId, veNFTs })

    for (let index = 0; index < veNFTs.length; index++)
      if (paramTokenId.eq(new BigNumber(veNFTs[index].toString()))) dropdownOnSelect(index.toString())
  }, [account, chainId, tokenId, JSON.stringify(veNFTTokenIds), useLockPendingTokenId, userTokenId, dropdownOnSelect]) // eslint-disable-line

  // TODO: fix eslint warning. we should change JSON.stringify for preventing side effect
  const dropdownOptions = useMemo(() => {
    const veNFTLength = veNFTTokenIds.length
    if (!veNFTLength) return []

    const tokenIDs = veNFTTokenIds.map((token, index) => {
      return { value: index.toString(), label: `NFT #${token.toString()}` }
    })

    const lockedOrPendingNFTs = []
    if (useLockPendingTokenId.toNumber() != 0)
      lockedOrPendingNFTs.push({ value: veNFTLength.toString(), label: `Pending #${useLockPendingTokenId.toString()}` })
    if (userTokenId.toNumber() != 0)
      lockedOrPendingNFTs.push({ value: (veNFTLength + 1).toString(), label: `Locked #${userTokenId.toString()}` })

    return [...tokenIDs, ...lockedOrPendingNFTs]
  }, [JSON.stringify(veNFTTokenIds)]) // eslint-disable-line

  return (
    <Container>
      <Hero>
        <div>Solidly Vote</div>
        <HeroSubtext>Vote with your veNFT.</HeroSubtext>
      </Hero>
      <Wrapper>
        <UpperRow>
          <SearchField searchProps={searchProps} />
          <Dropdown
            options={dropdownOptions}
            placeholder="Select Token ID"
            defaultValue={dropDownDefaultValue}
            onSelect={(v) => dropdownOnSelect(v)}
            width="200px"
          />
        </UpperRow>
        <Table
          options={snapshot.options as unknown as SolidlyPair[]}
          votes={votes}
          setVotes={setVotes}
          preVotedPairs={preVotedPairs}
          selectedVeNFTType={selectedVeNFTType}
        />
      </Wrapper>
      <VotingPower
        votes={votes}
        onCastVote={onCastVote}
        loading={loading}
        setLoading={setLoading}
        preVotedPairs={preVotedPairs}
        selectedVeNFTType={selectedVeNFTType}
      />
      <Disclaimer />
    </Container>
  )
}
