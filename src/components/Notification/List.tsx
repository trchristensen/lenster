import { gql, useQuery } from '@apollo/client'
import { EmptyState } from '@components/UI/EmptyState'
import { ErrorMessage } from '@components/UI/ErrorMessage'
import { Spinner } from '@components/UI/Spinner'
import AppContext from '@components/utils/AppContext'
import { Notification, PaginatedResultInfo } from '@generated/types'
import { MinimalProfileFields } from '@gql/MinimalProfileFields'
import { MailIcon } from '@heroicons/react/outline'
import consoleLog from '@lib/consoleLog'
import { FC, useContext, useEffect, useState } from 'react'
import { useInView } from 'react-cool-inview'

import NotificationShimmer from './Shimmer'
import CollectNotification from './Type/CollectNotification'
import CommentNotification from './Type/CommentNotification'
import FollowerNotification from './Type/FollowerNotification'
import MirrorNotification from './Type/MirrorNotification'

const NOTIFICATIONS_QUERY = gql`
  query Notifications($request: NotificationRequest!) {
    notifications(request: $request) {
      items {
        ... on NewFollowerNotification {
          wallet {
            address
            defaultProfile {
              ...MinimalProfileFields
            }
          }
          createdAt
        }
        ... on NewCommentNotification {
          profile {
            ...MinimalProfileFields
          }
          comment {
            id
            metadata {
              content
            }
            commentOn {
              ... on Post {
                id
              }
              ... on Comment {
                id
              }
              ... on Mirror {
                id
              }
            }
          }
          createdAt
        }
        ... on NewMirrorNotification {
          profile {
            ...MinimalProfileFields
          }
          publication {
            ... on Post {
              id
              metadata {
                content
              }
            }
            ... on Comment {
              id
              metadata {
                content
              }
            }
          }
          createdAt
        }
        ... on NewCollectNotification {
          wallet {
            address
            defaultProfile {
              ...MinimalProfileFields
            }
          }
          collectedPublication {
            ... on Post {
              id
              metadata {
                ...NotificationCollectMetadataFields
              }
              collectModule {
                ...NotificationCollectModuleFields
              }
            }
            ... on Comment {
              id
              metadata {
                ...NotificationCollectMetadataFields
              }
              collectModule {
                ...NotificationCollectModuleFields
              }
            }
          }
          createdAt
        }
      }
      pageInfo {
        next
      }
    }
  }
  ${MinimalProfileFields}
  fragment NotificationCollectModuleFields on CollectModule {
    ... on FeeCollectModuleSettings {
      amount {
        asset {
          symbol
        }
        value
      }
    }
    ... on LimitedFeeCollectModuleSettings {
      amount {
        asset {
          symbol
        }
        value
      }
    }
    ... on LimitedTimedFeeCollectModuleSettings {
      amount {
        asset {
          symbol
        }
        value
      }
    }
    ... on TimedFeeCollectModuleSettings {
      amount {
        asset {
          symbol
        }
        value
      }
    }
  }
  fragment NotificationCollectMetadataFields on MetadataOutput {
    name
    content
    cover {
      original {
        url
      }
    }
    attributes {
      value
    }
  }
`

const List: FC = () => {
  const { currentUser } = useContext(AppContext)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>()
  const { data, loading, error, fetchMore, refetch } = useQuery(
    NOTIFICATIONS_QUERY,
    {
      variables: {
        request: { profileId: currentUser?.id, limit: 10 }
      },
      onCompleted(data) {
        setPageInfo(data?.notifications?.pageInfo)
        setNotifications(data?.notifications?.items)
        consoleLog('Fetch', '#8b5cf6', `Fetched first 10 notifications`)
      }
    }
  )

  useEffect(() => {
    refetch()
  }, [refetch])

  const { observe } = useInView({
    threshold: 1,
    onEnter: () => {
      fetchMore({
        variables: {
          request: {
            profileId: currentUser?.id,
            cursor: pageInfo?.next,
            limit: 10
          }
        }
      }).then(({ data }: any) => {
        setPageInfo(data?.notifications?.pageInfo)
        setNotifications([...notifications, ...data?.notifications?.items])
        consoleLog(
          'Fetch',
          '#8b5cf6',
          `Fetched next 10 notifications Next:${pageInfo?.next}`
        )
      })
    }
  })

  if (loading)
    return (
      <div className="divide-y">
        <NotificationShimmer />
        <NotificationShimmer />
        <NotificationShimmer />
        <NotificationShimmer />
      </div>
    )

  if (error)
    return (
      <ErrorMessage
        className="m-3"
        title="Failed to load notifications"
        error={error}
      />
    )

  if (data?.notifications?.items?.length === 0)
    return (
      <EmptyState
        message={
          <div>
            <span>Inbox zero!</span>
          </div>
        }
        icon={<MailIcon className="w-8 h-8 text-brand-500" />}
        hideCard
      />
    )

  return (
    <div className="divide-y">
      {notifications?.map((notification: Notification, index: number) => (
        <div key={index}>
          {notification.__typename === 'NewFollowerNotification' && (
            <div className="p-4">
              <FollowerNotification notification={notification} />
            </div>
          )}
          {notification.__typename === 'NewCommentNotification' && (
            <div className="p-4">
              <CommentNotification notification={notification} />
            </div>
          )}
          {notification.__typename === 'NewMirrorNotification' && (
            <div className="p-4">
              <MirrorNotification notification={notification} />
            </div>
          )}
          {notification.__typename === 'NewCollectNotification' && (
            <div className="p-4">
              <CollectNotification notification={notification} />
            </div>
          )}
        </div>
      ))}
      {pageInfo?.next && (
        <span ref={observe} className="flex justify-center p-5">
          <Spinner size="sm" />
        </span>
      )}
    </div>
  )
}

export default List
