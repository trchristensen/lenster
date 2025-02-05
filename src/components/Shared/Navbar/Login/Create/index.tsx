import { gql, useMutation } from '@apollo/client'
import ChooseFile from '@components/Shared/ChooseFile'
import SwitchNetwork from '@components/Shared/SwitchNetwork'
import { Button } from '@components/UI/Button'
import { ErrorMessage } from '@components/UI/ErrorMessage'
import { Form, useZodForm } from '@components/UI/Form'
import { Input } from '@components/UI/Input'
import { Spinner } from '@components/UI/Spinner'
import { PlusIcon } from '@heroicons/react/outline'
import trackEvent from '@lib/trackEvent'
import uploadAssetsToIPFS from '@lib/uploadAssetsToIPFS'
import React, { ChangeEvent, FC, useState } from 'react'
import { useNetwork } from 'wagmi'
import { object, string } from 'zod'

import Pending from './Pending'

const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($request: CreateProfileRequest!) {
    createProfile(request: $request) {
      ... on RelayerResult {
        txHash
      }
      ... on RelayError {
        reason
      }
    }
  }
`

const newUserSchema = object({
  handle: string()
    .min(2, { message: 'Handle should be atleast 2 characters' })
    .max(31, { message: 'Handle should be less than 32 characters' })
    .regex(/^[a-z0-9]+$/, {
      message: 'Handle should only contain alphanumeric characters'
    })
})

const Create: FC = () => {
  const [avatar, setAvatar] = useState<string>()
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [{ data: network }] = useNetwork()
  const [createProfile, { data, loading }] = useMutation(
    CREATE_PROFILE_MUTATION
  )

  const form = useZodForm({
    schema: newUserSchema
  })

  const handleUpload = async (evt: ChangeEvent<HTMLInputElement>) => {
    evt.preventDefault()
    setUploading(true)
    try {
      // @ts-ignore
      const attachment = await uploadAssetsToIPFS(evt.target.files[0])
      setAvatar(attachment.item)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {data?.createProfile?.txHash ? (
        <Pending
          handle={form.getValues('handle')}
          txHash={data?.createProfile?.txHash}
        />
      ) : (
        <Form
          form={form}
          className="space-y-4"
          onSubmit={async ({ handle }) => {
            setIsUploading(true)
            const username = handle.toLowerCase()

            trackEvent('signup')
            createProfile({
              variables: {
                request: {
                  handle: username,
                  profilePictureUri: avatar
                    ? avatar
                    : `https://avatar.tobi.sh/${username}.png`
                }
              }
            })
          }}
        >
          {data?.createProfile?.reason && (
            <ErrorMessage
              className="mb-3"
              title="Create profile failed!"
              error={{
                name: 'Create profile failed!',
                message: data?.createProfile?.reason
              }}
            />
          )}
          <Input
            label="Handle"
            type="text"
            placeholder="justinbieber"
            prefix="https://lenster.xyz/u/"
            {...form.register('handle')}
          />
          <div className="space-y-1.5">
            <label>Avatar</label>
            <div className="space-y-3">
              {avatar && (
                <div>
                  <img
                    className="rounded-lg w-60 h-60"
                    src={avatar}
                    alt={avatar}
                  />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-3">
                  <ChooseFile
                    onChange={(evt: ChangeEvent<HTMLInputElement>) =>
                      handleUpload(evt)
                    }
                  />
                  {uploading && <Spinner size="sm" />}
                </div>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            {network.chain?.unsupported ? (
              <SwitchNetwork />
            ) : (
              <Button
                type="submit"
                disabled={isUploading || loading}
                icon={
                  isUploading || loading ? (
                    <Spinner size="xs" />
                  ) : (
                    <PlusIcon className="w-4 h-4" />
                  )
                }
              >
                Signup
              </Button>
            )}
          </div>
        </Form>
      )}
    </>
  )
}

export default Create
