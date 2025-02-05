import { gql } from '@apollo/client'

import { CollectModuleFields } from './CollectModuleFields'
import { MinimalProfileFields } from './MinimalProfileFields'

export const PostFields = gql`
  fragment PostFields on Post {
    id
    profile {
      ...MinimalProfileFields
    }
    collectedBy {
      defaultProfile {
        handle
      }
    }
    collectModule {
      ...CollectModuleFields
    }
    stats {
      totalAmountOfComments
      totalAmountOfMirrors
      totalAmountOfCollects
    }
    metadata {
      name
      description
      content
      description
      media {
        original {
          url
          mimeType
        }
      }
      cover {
        original {
          url
        }
      }
      attributes {
        value
      }
    }
    createdAt
    appId
  }
  ${MinimalProfileFields}
  ${CollectModuleFields}
`
