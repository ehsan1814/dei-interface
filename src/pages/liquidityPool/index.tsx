import React, { useState, useMemo, useCallback } from 'react'
import styled from 'styled-components'

import { useCurrencyBalance } from 'state/wallet/hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import useWeb3React from 'hooks/useWeb3'
import { useSupportedChainId } from 'hooks/useSupportedChainId'
import useApproveCallback, { ApprovalState } from 'hooks/useApproveCallback'
import { tryParseAmount } from 'utils/parse'

import { PrimaryButton } from 'components/Button'
import { DotFlashing } from 'components/Icons'
import Hero from 'components/Hero'
import Disclaimer from 'components/Disclaimer'
import InputBox from 'components/App/Redemption/InputBox'
import { DEI_TOKEN, BDEI_TOKEN } from 'constants/tokens'
import { DynamicRedeemer } from 'constants/addresses'
// import StakeBox from 'components/App/deiPool/StakeBox'
import { ActionTypes } from 'components/StableCoin2'
import { ActionSetter } from 'components/StableCoin2'
import AdvancedOptions from 'components/App/Swap/AdvancedOptions'
import StakeBox from 'components/App/deiPool/StakeBox'

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  overflow: visible;
  margin: 0 auto;
`

const Wrapper = styled(Container)`
  margin-top: 50px;
  width: clamp(250px, 90%, 500px);
  background-color: rgb(13 13 13);
  padding: 20px 15px;
  border: 1px solid rgb(0, 0, 0);
  border-radius: 15px;
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
  /* justify-content: center; */
  /* & > * {
    &:nth-child(2) {
      margin: 15px auto;
    }
  } */
`

const TopWrapper = styled.div`
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const FarmWrapper = styled(Wrapper)`
  border-radius: 15px;
`

const LiquidityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
`

const ToggleState = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: rgb(13 13 13);
  border-radius: 15px;
  margin: 0 auto;
  margin-top: 50px;
  margin-bottom: -45px;
  width: clamp(250px, 90%, 500px);
`

const StateButton = styled.div`
  width: 50%;
  text-align: center;
  padding: 12px;
  cursor: pointer;
`

const DepositButton = styled(PrimaryButton)`
  border-radius: 15px;
`

const LeftTitle = styled.span`
  font-size: 24px;
  font-weight: 500;
`

export default function Redemption() {
  const { chainId, account } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const isSupportedChainId = useSupportedChainId()
  const [amountIn, setAmountIn] = useState('')
  const [amountIn2, setAmountIn2] = useState('')
  const deiCurrency = DEI_TOKEN
  const bdeiCurrency = BDEI_TOKEN
  const deiCurrencyBalance = useCurrencyBalance(account ?? undefined, deiCurrency)
  const bdeiCurrencyBalance = useCurrencyBalance(account ?? undefined, bdeiCurrency)

  const deiAmount = useMemo(() => {
    return tryParseAmount(amountIn, deiCurrency || undefined)
  }, [amountIn, deiCurrency])

  const bdeiAmount = useMemo(() => {
    return tryParseAmount(amountIn2, bdeiCurrency || undefined)
  }, [amountIn2, bdeiCurrency])

  const insufficientBalance = useMemo(() => {
    if (!deiAmount || !bdeiAmount) return false
    return deiCurrencyBalance?.lessThan(deiAmount) && bdeiCurrencyBalance?.lessThan(bdeiAmount)
  }, [deiCurrencyBalance, bdeiCurrencyBalance, deiAmount, bdeiAmount])

  // const {
  //   state: depositCallbackState,
  //   callback: depositCallback,
  //   error: depositCallbackError,
  // } = useRedemptionCallback(deiCurrency, usdcCurrency, deiAmount, usdcAmount, amountOut2)

  const [awaitingApproveConfirmation, setAwaitingApproveConfirmation] = useState<boolean>(false)
  const [awaitingRedeemConfirmation, setAwaitingRedeemConfirmation] = useState<boolean>(false)
  const spender = useMemo(() => (chainId ? DynamicRedeemer[chainId] : undefined), [chainId])
  const [approvalState, approveCallback] = useApproveCallback(deiCurrency ?? undefined, spender)
  const [showApprove, showApproveLoader] = useMemo(() => {
    const show = deiCurrency && approvalState !== ApprovalState.APPROVED && !!amountIn
    return [show, show && approvalState === ApprovalState.PENDING]
  }, [deiCurrency, approvalState, amountIn])

  const [approvalState2, approveCallback2] = useApproveCallback(bdeiCurrency ?? undefined, spender)
  const [showApprove2, showApproveLoader2] = useMemo(() => {
    const show = bdeiCurrency && approvalState2 !== ApprovalState.APPROVED && !!amountIn2
    return [show, show && approvalState2 === ApprovalState.PENDING]
  }, [bdeiCurrency, approvalState2, amountIn2])

  const handleApprove = async () => {
    setAwaitingApproveConfirmation(true)
    await approveCallback()
    setAwaitingApproveConfirmation(false)
  }

  const handleApprove2 = async () => {
    setAwaitingApproveConfirmation(true)
    await approveCallback2()
    setAwaitingApproveConfirmation(false)
  }

  const handleDeposit = useCallback(async () => {
    console.log('handleDeposit')

    //   console.log('called handleDeposit')
    //   console.log(depositCallbackState, depositCallback, depositCallbackError)
    //   if (!depositCallback) return
    //   try {
    //     setAwaitingDepositConfirmation(true)
    //     const txHash = await depositCallback()
    //     setAwaitingDepositConfirmation(false)
    //     console.log({ txHash })
    //   } catch (e) {
    //     setAwaitingDepositConfirmation(false)
    //     if (e instanceof Error) {
    //       // error = e.message
    //     } else {
    //       console.error(e)
    //       // error = 'An unknown error occurred.'
    //     }
    //   }
  }, []) // depositCallbackState, depositCallback, depositCallbackError

  function getApproveButton(): JSX.Element | null {
    if (!isSupportedChainId || !account) {
      return null
    }
    if (awaitingApproveConfirmation) {
      return (
        <DepositButton active>
          Awaiting Confirmation <DotFlashing style={{ marginLeft: '10px' }} />
        </DepositButton>
      )
    }
    if (showApproveLoader || showApproveLoader2) {
      return (
        <DepositButton active>
          Approving <DotFlashing style={{ marginLeft: '10px' }} />
        </DepositButton>
      )
    }
    if (showApprove) {
      return <DepositButton onClick={handleApprove}>Allow us to spend {deiCurrency?.symbol}</DepositButton>
    } else if (showApprove2) {
      return <DepositButton onClick={handleApprove2}>Allow us to spend {bdeiCurrency?.symbol}</DepositButton>
    }
    return null
  }

  function getActionButton(type: string): JSX.Element | null {
    if (!chainId || !account) {
      return <DepositButton onClick={toggleWalletModal}>Connect Wallet</DepositButton>
    }
    if (showApprove || showApprove2) {
      return null
    }

    if (insufficientBalance) {
      return <DepositButton disabled>Insufficient {deiCurrency?.symbol} Balance</DepositButton>
    }
    if (awaitingRedeemConfirmation) {
      return (
        <DepositButton>
          {type === 'add' ? 'Depositing DEI/bDEI' : 'Withdrawing DEI/bDEI'}
          <DotFlashing style={{ marginLeft: '10px' }} />
        </DepositButton>
      )
    }

    return <DepositButton onClick={() => handleDeposit()}>{type === 'add' ? 'Deposit' : 'Withdraw'}</DepositButton>
  }

  const [selected, setSelected] = useState<ActionTypes>(ActionTypes.ADD)
  const [slippage, setSlippage] = useState(0.5)

  const getAppComponent = (): JSX.Element => {
    if (selected == ActionTypes.REMOVE) {
      return (
        <>
          <Wrapper>
            <InputBox
              currency={deiCurrency}
              value={amountIn}
              onChange={(value: string) => setAmountIn(value)}
              title={'From'}
            />

            <div style={{ marginTop: '20px' }}></div>

            <InputBox
              currency={bdeiCurrency}
              value={amountIn2}
              onChange={(value: string) => setAmountIn2(value)}
              title={'From'}
            />

            <div style={{ marginTop: '20px' }}></div>
            {getApproveButton()}
            {getActionButton('remove')}
          </Wrapper>
        </>
      )
    } else {
      return (
        <>
          <Wrapper>
            <InputBox
              currency={deiCurrency}
              value={amountIn}
              onChange={(value: string) => setAmountIn(value)}
              title={'From'}
            />

            <div style={{ marginTop: '20px' }}></div>

            <InputBox
              currency={bdeiCurrency}
              value={amountIn2}
              onChange={(value: string) => setAmountIn2(value)}
              title={'From'}
            />

            <div style={{ marginTop: '20px' }}></div>
            {getApproveButton()}
            {getActionButton('add')}
          </Wrapper>
        </>
      )
    }
  }

  return (
    <Container>
      <Hero>
        <div>Liquidity pool</div>
      </Hero>
      <TopWrapper>
        <LiquidityWrapper>
          <ToggleState>
            <ActionSetter selected={selected} setSelected={setSelected} />
          </ToggleState>

          {getAppComponent()}
          <AdvancedOptions slippage={slippage} setSlippage={setSlippage} />
        </LiquidityWrapper>
        <FarmWrapper>
          <LeftTitle>My farm</LeftTitle>
          <div style={{ marginTop: '20px' }}></div>
          <StakeBox
            currency={null}
            onClick={(value: string) => console.log('test')}
            onChange={(value: string) => console.log('test')}
            type={'Stake All'}
            value={'1.48'}
            title={'LP Available'}
          />
          <div style={{ marginTop: '20px' }}></div>
          <StakeBox
            currency={null}
            onClick={(value: string) => console.log('test')}
            onChange={(value: string) => console.log('test')}
            type={'Unstake All'}
            value={'2.1'}
            title={'LP Staked'}
          />
        </FarmWrapper>
      </TopWrapper>
      <Disclaimer />
    </Container>
  )
}