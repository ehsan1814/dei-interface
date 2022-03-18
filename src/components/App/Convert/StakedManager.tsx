import React, { useState } from 'react'
import styled from 'styled-components'

import { PrimaryButton } from 'components/Button'
import ManagerModal from './ManagerModal'

const Wrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
`

const TableWrapper = styled.table`
  width: 100%;
  overflow: hidden;
  border-collapse: collapse;
`

const Head = styled.thead`
  & > tr {
    height: auto;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.text1};
    background: ${({ theme }) => theme.bg0};
  }
`

const Row = styled.tr`
  align-items: center;
  height: 21px;
  font-size: 0.7rem;
  line-height: 0.8rem;
  color: ${({ theme }) => theme.text1};
`

const Cel = styled.td<{
  justify?: boolean
}>`
  text-align: center;
  padding: 5px;
  border: 1px solid ${({ theme }) => theme.border1};
  min-width: 100px;
`

export default function StakedManager() {
  const [showManagerModal, setShowManagerModal] = useState(false)

  const toggleManagerModal = () => {
    setShowManagerModal((prev) => !prev)
  }

  return (
    <Wrapper>
      <TableWrapper>
        <Head>
          <tr>
            <Cel> </Cel>
            <Cel>TVL</Cel>
            <Cel>APR</Cel>
            <Cel>Your Staked SOLIDfluid</Cel>
            <Cel>Your Rewards</Cel>
            <Cel> </Cel>
            <Cel> </Cel>
          </tr>
        </Head>
        <tbody>
          <Row>
            <Cel>Staked SOLIDfluid</Cel>
            <Cel>N/A</Cel>
            <Cel>N/A</Cel>
            <Cel>N/A</Cel>
            <Cel>N/A</Cel>
            <Cel>
              <PrimaryButton onClick={toggleManagerModal}>Manage</PrimaryButton>
            </Cel>
            <Cel>
              <PrimaryButton disabled>Claim Rewards</PrimaryButton>
            </Cel>
          </Row>
        </tbody>
      </TableWrapper>
      <ManagerModal isOpen={showManagerModal} onDismiss={toggleManagerModal} />
    </Wrapper>
  )
}
