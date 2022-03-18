import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { ZERO } from '@sushiswap/core-sdk'
import BigNumber from 'bignumber.js'

import useWeb3React from 'hooks/useWeb3'
import { useCurrencyBalance } from 'state/wallet/hooks'
import useApproveCallback, { ApprovalState } from 'hooks/useApproveCallback'
import { useCurrency } from 'hooks/useCurrency'
import { useSupportedChainId } from 'hooks/useSupportedChainId'
import { useWalletModalToggle } from 'state/application/hooks'
import useRpcChangerCallback from 'hooks/useRpcChangerCallback'

import { SolidAddress, Locker } from 'constants/addresses'
import { FALLBACK_CHAIN_ID, SupportedChainId } from 'constants/chains'

import { Warning, Balance } from './Labels'
import { InputWrapper, NumericalInput } from 'components/Input'
import { PrimaryButton } from 'components/Button'
import { Card } from 'components/Card'
import { TabWrapper, TabButton } from 'components/Tab'
import { DotFlashing } from 'components/Icons'
import Dropdown from 'components/Dropdown'

const Container = styled(Card)`
  gap: 20px;
`

const Title = styled.div`
  font-size: 1.1rem;
  & > span {
    font-size: 0.8rem;
  }
`

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 5px;
`

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 5px;
  overflow: visible;
  & > * {
    &:first-child {
      margin-right: 5px;
    }
    &:not(first-child) {
      width: fit-content;
      min-width: 200px;
    }
  }
`

const MaxButton = styled.span`
  color: ${({ theme }) => theme.text2};
  &:hover {
    cursor: pointer;
  }
`

export enum ConvertAction {
  TOKEN = 'FLUID Token',
  NFT = 'FLUID NFT',
}

export default function Convert() {
  const [selectedAction, setSelectedAction] = useState<ConvertAction>(ConvertAction.TOKEN)
  return (
    <Container>
      <Title>
        Convert & Stake Solidly NFTs/Tokens into SOLID<span>fluid</span>
      </Title>
      <TabWrapper>
        <TabButton
          active={selectedAction === ConvertAction.TOKEN}
          onClick={() => setSelectedAction(ConvertAction.TOKEN)}
        >
          {ConvertAction.TOKEN}
        </TabButton>
        <TabButton active={selectedAction === ConvertAction.NFT} onClick={() => setSelectedAction(ConvertAction.NFT)}>
          {ConvertAction.NFT}
        </TabButton>
      </TabWrapper>
      {selectedAction === ConvertAction.TOKEN ? <ConvertToken /> : <ConvertNFT />}
    </Container>
  )
}

function ConvertToken() {
  const { chainId, account } = useWeb3React()
  const isSupportedChainId = useSupportedChainId()
  const toggleWalletModal = useWalletModalToggle()
  const rpcChangerCallback = useRpcChangerCallback()
  const [awaitingApproveConfirmation, setAwaitingApproveConfirmation] = useState(false)
  const [awaitingConvertConfirmation, setAwaitingConvertConfirmation] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  const solidAddress = useMemo(
    () => (chainId && chainId in SolidAddress ? SolidAddress[chainId] : SolidAddress[FALLBACK_CHAIN_ID]),
    [chainId]
  )
  const solidCurrency = useCurrency(solidAddress)
  const balance = useCurrencyBalance(account ?? undefined, solidCurrency ?? undefined)
  const formattedBalance = useMemo(() => (balance ? balance.toSignificant() : '0'), [balance])

  const spender = useMemo(() => (chainId && chainId in Locker ? Locker[chainId] : Locker[FALLBACK_CHAIN_ID]), [chainId])
  const [approvalState, approveCallback] = useApproveCallback(solidCurrency ?? undefined, spender)

  const [showApprove, showApproveLoader] = useMemo(() => {
    const show = solidCurrency && approvalState !== ApprovalState.APPROVED
    return [show, show && approvalState === ApprovalState.PENDING]
  }, [solidCurrency, approvalState])

  const INSUFFICIENT_AMOUNT = useMemo(() => {
    if (!balance || balance.equalTo(ZERO)) return false
    return new BigNumber(balance.toExact()).isLessThan(typedValue)
  }, [balance, typedValue])

  const handleApprove = async () => {
    setAwaitingApproveConfirmation(true)
    await approveCallback()
    setAwaitingApproveConfirmation(false)
  }

  const handleConvert = async () => {
    setAwaitingConvertConfirmation(true)
    // await something here
    setAwaitingConvertConfirmation(false)
  }

  function getApproveButton(): JSX.Element | null {
    if (!isSupportedChainId) return null
    if (awaitingApproveConfirmation) {
      return (
        <PrimaryButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </PrimaryButton>
      )
    }
    if (showApproveLoader) {
      return (
        <PrimaryButton active>
          Approving <DotFlashing style={{ marginLeft: '10px' }} />
        </PrimaryButton>
      )
    }
    if (showApprove) {
      return <PrimaryButton onClick={handleApprove}>Approve</PrimaryButton>
    }
    return null
  }

  function getActionButton(): JSX.Element | null {
    if (!account) {
      return <PrimaryButton onClick={toggleWalletModal}>Connect Wallet</PrimaryButton>
    }
    if (!isSupportedChainId) {
      return <PrimaryButton onClick={() => rpcChangerCallback(SupportedChainId.FANTOM)}>Switch to Fantom</PrimaryButton>
    }
    if (!!getApproveButton()) {
      return <PrimaryButton disabled>Convert Tokens</PrimaryButton>
    }
    if (INSUFFICIENT_AMOUNT) {
      return <PrimaryButton disabled>Insufficient Balance</PrimaryButton>
    }
    if (awaitingConvertConfirmation) {
      return (
        <PrimaryButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </PrimaryButton>
      )
    }
    return <PrimaryButton onClick={handleConvert}>Convert Tokens</PrimaryButton>
  }

  return (
    <Wrapper>
      <Warning>This process is irreversible</Warning>
      <Balance>Balance: {formattedBalance} SOLID</Balance>
      <Row>
        <InputWrapper>
          <NumericalInput value={typedValue} onUserInput={setTypedValue} placeholder="Enter an amount" />
          <MaxButton onClick={() => setTypedValue(balance?.toExact() ?? '0')}>MAX</MaxButton>
        </InputWrapper>
        {getApproveButton()}
        {getActionButton()}
      </Row>
    </Wrapper>
  )
}

function ConvertNFT() {
  const { account } = useWeb3React()
  const isSupportedChainId = useSupportedChainId()
  const toggleWalletModal = useWalletModalToggle()
  const rpcChangerCallback = useRpcChangerCallback()
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const handleConvert = async () => {
    setAwaitingConfirmation(true)
    // await something here
    setAwaitingConfirmation(false)
  }

  const onDropdownSelect = () => {
    console.log('selected')
  }

  function getActionButton(): JSX.Element | null {
    if (!account) {
      return <PrimaryButton onClick={toggleWalletModal}>Connect Wallet</PrimaryButton>
    }
    if (!isSupportedChainId) {
      return <PrimaryButton onClick={() => rpcChangerCallback(SupportedChainId.FANTOM)}>Switch to Fantom</PrimaryButton>
    }
    if (awaitingConfirmation) {
      return (
        <PrimaryButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </PrimaryButton>
      )
    }
    return <PrimaryButton onClick={handleConvert}>Convert NFT</PrimaryButton>
  }

  return (
    <Wrapper>
      <Warning>This process is irreversible</Warning>
      <Balance>Balance: N/A SOLID in all NFTs</Balance>
      <Row>
        <Dropdown
          options={[
            { value: '1', label: 'NFT 1' },
            { value: '2', label: 'NFT 2' },
          ]}
          placeholder="Select Token ID"
          onSelect={onDropdownSelect}
          width="200px"
        />
        {getActionButton()}
      </Row>
    </Wrapper>
  )
}
