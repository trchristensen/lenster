import { gql, useQuery } from '@apollo/client'
import { GridItemEight, GridItemFour, GridLayout } from '@components/GridLayout'
import { Card } from '@components/UI/Card'
import { PageLoading } from '@components/UI/PageLoading'
import { Spinner } from '@components/UI/Spinner'
import AppContext from '@components/utils/AppContext'
import SEO from '@components/utils/SEO'
import { Erc20 } from '@generated/types'
import consoleLog from '@lib/consoleLog'
import { NextPage } from 'next'
import React, { useContext, useState } from 'react'
import { DEFAULT_COLLECT_TOKEN } from 'src/constants'
import Custom404 from 'src/pages/404'
import Custom500 from 'src/pages/500'

import Sidebar from '../Sidebar'
import Allowance from './Allowance'

const ALLOWANCE_SETTINGS_QUERY = gql`
  query ApprovedModuleAllowanceAmount(
    $request: ApprovedModuleAllowanceAmountRequest!
  ) {
    approvedModuleAllowanceAmount(request: $request) {
      currency
      module
      allowance
      contractAddress
    }
    enabledModuleCurrencies {
      name
      symbol
      decimals
      address
    }
  }
`

const getAllowancePayload = (currency: string) => {
  return {
    currencies: [currency],
    collectModules: [
      'LimitedFeeCollectModule',
      'FeeCollectModule',
      'LimitedTimedFeeCollectModule',
      'TimedFeeCollectModule',
      'FreeCollectModule',
      'RevertCollectModule'
    ],
    followModules: ['FeeFollowModule'],
    referenceModules: ['FollowerOnlyReferenceModule']
  }
}

const AllowanceSettings: NextPage = () => {
  const { currentUser } = useContext(AppContext)
  const [currencyLoading, setCurrencyLoading] = useState<boolean>(false)
  const { data, loading, error, refetch } = useQuery(ALLOWANCE_SETTINGS_QUERY, {
    variables: {
      request: getAllowancePayload(DEFAULT_COLLECT_TOKEN)
    },
    skip: !currentUser?.id,
    onCompleted() {
      consoleLog('Fetch', '#8b5cf6', `Fetched allowance settings`)
    }
  })

  if (error) return <Custom500 />
  if (loading) return <PageLoading message="Loading settings" />
  if (!currentUser) return <Custom404 />

  return (
    <GridLayout>
      <SEO title="Allowance settings • Lenster" />
      <GridItemFour>
        <Sidebar />
      </GridItemFour>
      <GridItemEight>
        <Card className="space-y-5">
          <div className="m-5">
            <div className="mb-1 font-medium text-gray-800 dark:text-gray-200">
              Select Currency
            </div>
            <select
              className="w-full bg-white rounded-xl border border-gray-300 outline-none dark:bg-gray-800 dark:border-gray-700 disabled:bg-gray-500 disabled:bg-opacity-20 disabled:opacity-60 focus:border-brand-500 focus:ring-brand-400"
              onChange={(e) => {
                setCurrencyLoading(true)
                refetch({
                  request: getAllowancePayload(e.target.value)
                }).finally(() => setCurrencyLoading(false))
              }}
            >
              {data?.enabledModuleCurrencies.map((currency: Erc20) => (
                <option key={currency.symbol} value={currency.address}>
                  {currency.name}
                </option>
              ))}
            </select>
          </div>
          {currencyLoading ? (
            <div className="py-10 space-y-3 text-center">
              <Spinner className="mx-auto" />
              <div>Loading allowance data!</div>
            </div>
          ) : (
            <Allowance allowance={data} />
          )}
        </Card>
      </GridItemEight>
    </GridLayout>
  )
}

export default AllowanceSettings
