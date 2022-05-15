import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'

import { VoteType } from 'hooks/useVoteCallback'
import { DotFlashing } from 'components/Icons'
import { veNFTType } from 'pages/vote'
import { useWalletModalToggle } from 'state/application/hooks'
import { preVoteType } from 'hooks/usePreVotedPairs'
import useWeb3React from 'hooks/useWeb3'

const enum VoteState {
  VALID = 'valid',
  NOT_VALID = 'not_valid',
}

const Container = styled.div`
  padding: 10px 0;
  width: 560px;
  background: rgba(20, 20, 20, 0.9);
  position: fixed;
  bottom: 30px;
  left: 50%;
  -webkit-transform: translatex(-50%);
  transform: translatex(-50%);
  border-radius: 12px;
  border: 1px solid rgba(126, 153, 176, 0.2);
  z-index: 50;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 80%;
  `}
`

const Wrapper = styled.div`
  width: calc(100% + 16px);
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  box-sizing: border-box;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin: 0px 40px 0px 0px;
  `}
`

const ItemsWrapper = styled.div`
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  margin: 0px 10px;
  height: 100%;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0px;
    margin-bottom: 10px;
  `}
`
const PowerItemsWrapper = styled.div`
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin: 0px 10px;
  height: 100%;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0px;
    margin-bottom: 10px;
  `}
`
const PowerWrapper = styled.div`
  display: flex;
  justify-content: left;
  margin: 0px 10px;
  height: 100%;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0px;
    margin-bottom: 10px;
  `}
`

const CastVote = styled.button<{ voteState: VoteState }>`
  width: 200px;
  height: 40px;
  border-radius: 12px;
  text-align: center;
  margin-top: auto;
  margin-bottom: auto;
  border: 1px solid rgba(126, 153, 176, 0.2);
  background-color: #789495;
  display: flex;
  justify-content: center;
  & > * {
    &:first-child {
      margin: 10px 5px 0px 0px;
    }
  }

  // Change color when the voting power exceeds 100
  border-color: ${({ theme, voteState }) => (voteState == VoteState.VALID ? theme.primary3 : 'red')};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 80%;
    margin: 10px 20px;
  `}
`

const CastVoteText = styled.span<{ voteState: VoteState }>`
  // Change color when the voting power exceeds 100
  color: ${({ theme, voteState }) => (voteState == VoteState.VALID ? theme.primary3 : 'red')};
`

const VotingPowerPercent = styled.div<{ voteState: VoteState }>`
  // Change color when the voting power exceeds 100
  color: ${({ theme, voteState }) => (voteState == VoteState.VALID ? theme.primary3 : 'red')};
  margin-left: 5px;
  width: 40px;
`

export default function VotingPower({
  votes,
  onCastVote,
  loading,
  setLoading,
  preVotedPairs,
  selectedVeNFTType,
}: {
  votes: VoteType[]
  onCastVote: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
  preVotedPairs: preVoteType[] | null
  selectedVeNFTType: veNFTType | null
}) {
  const { chainId, account } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [votingPower, setVotingPower] = useState(0)

  // this array used for save pre voted pairs amount
  const [preVotingPower, setPreVotingPower] = useState<preVoteType[] | null>([])
  // this is used to show whether a user can vote or not
  const voteState = useMemo(() => (votingPower > 100 ? VoteState.NOT_VALID : VoteState.VALID), [votingPower])

  useEffect(() => {
    let power = 0
    const preVotedPower: preVoteType[] | null = []
    votes.forEach((vote) => {
      if (preVotedPairs?.length) {
        const index = preVotedPairs.findIndex((preVote) => preVote.address.toLowerCase() === vote.address.toLowerCase())
        if (index > -1)
          preVotedPower.push({ address: vote.address, amount: vote.amount, symbol: preVotedPairs[index].symbol })
      }
      power += Math.abs(vote.amount)
    })
    setPreVotingPower(preVotedPower)
    setVotingPower(power)
  }, [votes, preVotedPairs])

  const castVoteHandler = () => {
    if (votingPower > 100) return
    setLoading(true)
    onCastVote()
  }

  return (
    <Container>
      <Wrapper>
        {!chainId || !account ? (
          <CastVote voteState={voteState} onClick={toggleWalletModal}>
            <CastVoteText voteState={voteState}>Connet Wallet</CastVoteText>
          </CastVote>
        ) : (
          <>
            {selectedVeNFTType != veNFTType.USER_WALLET_NFT ? (
              <PowerItemsWrapper>
                <PowerWrapper>
                  <p>Voting Power Used:</p>
                  <VotingPowerPercent voteState={voteState}>{votingPower}%</VotingPowerPercent>
                </PowerWrapper>
                <div>
                  {preVotingPower?.map((preVote, index) => (
                    <PowerWrapper key={index}>
                      {` ${preVote.symbol}:`}{' '}
                      <VotingPowerPercent voteState={voteState}>{`${preVote.amount}%`}</VotingPowerPercent>
                    </PowerWrapper>
                  ))}
                </div>
              </PowerItemsWrapper>
            ) : (
              <ItemsWrapper>
                <p>Voting Power Used:</p>
                <VotingPowerPercent voteState={voteState}>{votingPower}%</VotingPowerPercent>
              </ItemsWrapper>
            )}

            <CastVote voteState={voteState} onClick={castVoteHandler}>
              <CastVoteText voteState={voteState}>
                {selectedVeNFTType != veNFTType.USER_WALLET_NFT ? 'Lock & Vote' : 'Cast Votes'}
              </CastVoteText>
              {loading && <DotFlashing />}
            </CastVote>
          </>
        )}
      </Wrapper>
    </Container>
  )
}
