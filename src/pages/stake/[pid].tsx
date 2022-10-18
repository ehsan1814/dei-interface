import { useMemo } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import Hero from 'components/Hero'
import Disclaimer from 'components/Disclaimer'
import ImageWithFallback from 'components/ImageWithFallback'
import STAKE_ICON from '/public/static/images/pages/ic_stake.svg'
import { Stakings } from 'constants/stakingPools'
import StatsHeader from 'components/StatsHeader'
import LiquidityPool from 'components/App/Staking/LiquidityPool'
import StakingPool from 'components/App/Staking/StakingPool'

export const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  overflow: visible;
  margin: 0 auto;
`

const TopWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  margin: auto;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    min-width: 460px;
    flex-direction: column;
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 340px;
  `}
`

export default function StakingPage() {
  const router = useRouter()
  const { pid } = router.query
  const pidNumber = Number(pid)
  const pool = Stakings.find((pool) => pool.pid === pidNumber) || Stakings[0]

  const items = useMemo(
    () => [
      { name: 'APR', value: '4%' },
      { name: 'TVL', value: '$4.58m' },
      { name: 'Your Stake', value: `3,120.00 ${pool?.lpToken?.symbol}` },
    ],
    [pool?.lpToken?.symbol]
  )

  return (
    <Container>
      <Hero>
        <ImageWithFallback src={STAKE_ICON} width={224} height={133} alt={`Logo`} />
      </Hero>
      <StatsHeader items={items} pool={pool} />

      <TopWrapper>
        {pool?.tokens.length > 1 && <LiquidityPool pool={pool} />}
        <StakingPool pool={pool} />
      </TopWrapper>

      <Disclaimer />
    </Container>
  )
}