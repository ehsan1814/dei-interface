import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { ZERO } from '@sushiswap/core-sdk'

import useWeb3React from 'hooks/useWeb3'
import { useWalletModalToggle } from 'state/application/hooks'
import useRpcChangerCallback from 'hooks/useRpcChangerCallback'
import { useSupportedChainId } from 'hooks/useSupportedChainId'
import { useCurrencyBalance } from 'state/wallet/hooks'
import useApproveCallback, { ApprovalState } from 'hooks/useApproveCallback'
import { useCurrency } from 'hooks/useCurrency'

import { FluidAddress } from 'constants/addresses'
import { FALLBACK_CHAIN_ID, SupportedChainId } from 'constants/chains'

import { Modal, ModalHeader } from 'components/Modal'
import { TabWrapper, TabButton } from 'components/Tab'
import { PrimaryButton } from 'components/Button'
import { DotFlashing } from 'components/Icons'
import { Balance } from './Labels'
import { InputWrapper, NumericalInput } from 'components/Input'
import BigNumber from 'bignumber.js'

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  gap: 20px;
  padding: 0.5rem 1rem;
`

const ContentWrapper = styled(Wrapper)`
  gap: 5px;
  padding: 0;
  & > * {
    &:last-child {
      margin-top: 20px;
    }
  }
`

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 5px;
`

const MaxButton = styled.span`
  color: ${({ theme }) => theme.text2};
  &:hover {
    cursor: pointer;
  }
`

const StyledPrimaryButton = styled(PrimaryButton)`
  font-size: 0.8rem;
  padding: 1rem 0.3rem;
  min-width: fit-content;
`

enum Action {
  STAKE = 'Stake',
  WITHDRAW = 'Withdraw',
}

export default function ManagerModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const { account } = useWeb3React()
  const [selectedAction, setSelectedAction] = useState<Action>(Action.STAKE)
  const isSupportedChainId = useSupportedChainId()
  const toggleWalletModal = useWalletModalToggle()
  const rpcChangerCallback = useRpcChangerCallback()

  function getMainContent() {
    if (!account) {
      return <PrimaryButton onClick={toggleWalletModal}>Connect Wallet</PrimaryButton>
    }
    if (!isSupportedChainId) {
      return <PrimaryButton onClick={() => rpcChangerCallback(SupportedChainId.FANTOM)}>Switch to Fantom</PrimaryButton>
    }
    return selectedAction === Action.STAKE ? <Stake /> : <Withdraw />
  }

  return (
    <Modal isOpen={isOpen} onBackgroundClick={onDismiss} onEscapeKeydown={onDismiss}>
      <ModalHeader onClose={onDismiss} title="Manage SOLIDfluid" />
      <Wrapper>
        <TabWrapper>
          <TabButton active={selectedAction === Action.STAKE} onClick={() => setSelectedAction(Action.STAKE)}>
            {Action.STAKE}
          </TabButton>
          <TabButton active={selectedAction === Action.WITHDRAW} onClick={() => setSelectedAction(Action.WITHDRAW)}>
            {Action.WITHDRAW}
          </TabButton>
        </TabWrapper>
        {getMainContent()}
      </Wrapper>
    </Modal>
  )
}

function Stake() {
  const { chainId, account } = useWeb3React()
  const [awaitingApproveConfirmation, setAwaitingApproveConfirmation] = useState(false)
  const [awaitingStakeConfirmation, setAwaitingStakeConfirmation] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  // TODO WHICH ADDRESS DO WE NEED?
  const address = useMemo(
    () => (chainId && chainId in FluidAddress ? FluidAddress[chainId] : FluidAddress[FALLBACK_CHAIN_ID]),
    [chainId]
  )
  const fluidCurrency = useCurrency(address)
  const balance = useCurrencyBalance(account ?? undefined, fluidCurrency ?? undefined)
  const formattedBalance = useMemo(() => (balance ? balance.toSignificant() : '0'), [balance])

  // TODO WHO IS THE SPENDER?
  const spender = useMemo(
    () => (chainId && chainId in FluidAddress ? FluidAddress[chainId] : FluidAddress[FALLBACK_CHAIN_ID]),
    [chainId]
  )
  const [approvalState, approveCallback] = useApproveCallback(fluidCurrency ?? undefined, spender)

  const [showApprove, showApproveLoader] = useMemo(() => {
    const show = fluidCurrency && approvalState !== ApprovalState.APPROVED
    return [show, show && approvalState === ApprovalState.PENDING]
  }, [fluidCurrency, approvalState])

  const INSUFFICIENT_AMOUNT = useMemo(() => {
    if (!balance || balance.equalTo(ZERO)) return false
    return new BigNumber(balance.toExact()).isLessThan(typedValue)
  }, [balance, typedValue])

  const handleApprove = async () => {
    setAwaitingApproveConfirmation(true)
    await approveCallback()
    setAwaitingApproveConfirmation(false)
  }

  const handleStake = async () => {
    setAwaitingStakeConfirmation(true)
    // await something here
    setAwaitingStakeConfirmation(false)
  }

  function getApproveButton(): JSX.Element | null {
    if (awaitingApproveConfirmation) {
      return <StyledPrimaryButton active>Awaiting Confirmation</StyledPrimaryButton>
    }
    if (showApproveLoader) {
      return <StyledPrimaryButton active>Approving</StyledPrimaryButton>
    }
    if (showApprove) {
      return <StyledPrimaryButton onClick={handleApprove}>Approve</StyledPrimaryButton>
    }
    return null
  }

  function getActionButton(): JSX.Element | null {
    if (!!getApproveButton()) {
      return <StyledPrimaryButton disabled>Stake</StyledPrimaryButton>
    }
    if (INSUFFICIENT_AMOUNT) {
      return <StyledPrimaryButton disabled>Insufficient Balance</StyledPrimaryButton>
    }
    if (awaitingStakeConfirmation) {
      return (
        <StyledPrimaryButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </StyledPrimaryButton>
      )
    }
    return <StyledPrimaryButton onClick={handleStake}>Stake</StyledPrimaryButton>
  }

  return (
    <ContentWrapper>
      <InputWrapper>
        <NumericalInput value={typedValue} onUserInput={setTypedValue} placeholder="Enter an amount" />
        <MaxButton onClick={() => setTypedValue(balance?.toExact() ?? '0')}>MAX</MaxButton>
      </InputWrapper>
      <Balance>Balance: {formattedBalance} SOLIDfluid</Balance>
      <Row>
        {getApproveButton()}
        {getActionButton()}
      </Row>
    </ContentWrapper>
  )
}

function Withdraw() {
  const { chainId, account } = useWeb3React()
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  // TODO WHICH ADDRESS DO WE NEED?
  const address = useMemo(
    () => (chainId && chainId in FluidAddress ? FluidAddress[chainId] : FluidAddress[FALLBACK_CHAIN_ID]),
    [chainId]
  )

  const fluidCurrency = useCurrency(address)
  const balance = useCurrencyBalance(account ?? undefined, fluidCurrency ?? undefined)
  const formattedBalance = useMemo(() => (balance ? balance.toSignificant() : '0'), [balance])

  const handleWithdraw = async () => {
    setAwaitingConfirmation(true)
    // await something here
    setAwaitingConfirmation(false)
  }

  const INSUFFICIENT_AMOUNT = useMemo(() => {
    if (!balance || balance.equalTo(ZERO)) return false
    return new BigNumber(balance.toExact()).isLessThan(typedValue)
  }, [balance, typedValue])

  function getActionButton() {
    if (INSUFFICIENT_AMOUNT) {
      return <StyledPrimaryButton disabled>Insufficient Balance</StyledPrimaryButton>
    }
    if (awaitingConfirmation) {
      return (
        <StyledPrimaryButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </StyledPrimaryButton>
      )
    }
    return <StyledPrimaryButton onClick={handleWithdraw}>Stake</StyledPrimaryButton>
  }

  return (
    <ContentWrapper>
      <InputWrapper>
        <NumericalInput value={typedValue} onUserInput={setTypedValue} placeholder="Enter an amount" />
        <MaxButton onClick={() => setTypedValue(balance?.toExact() ?? '0')}>MAX</MaxButton>
      </InputWrapper>
      <Balance>Staked: {formattedBalance} SOLIDfluid</Balance>
      {getActionButton()}
    </ContentWrapper>
  )
}
