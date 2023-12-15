import React from "react";
import {
  Box,
  Button,
  FormControl,
  Link,
  Select,
  Spinner,
  Text,
  Textarea,
  TextInput,
} from "@primer/react";
import { useForm } from "react-hook-form";

import ContentWrapper from "./ContentWrapper.jsx";

export default function NewIssueForm({
  onSubmit,
  submittedIssueUrl,
  projectFields,
  isSubmittingIssue = false,
}) {
  const { formState, register, handleSubmit } = useForm({
    mode: "onTouched",
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const projectFieldsElements = projectFields.map((field) => {
    if (field.options) {
      const options = field.options.map((option) => {
        return (
          <Select.Option key={option.id} value={option.name}>
            {option.humanName || option.name}
          </Select.Option>
        );
      });

      return (
        <FormControl key={field.id}>
          <FormControl.Label>{field.name}</FormControl.Label>
          <Select {...register(field.name)} name={field.name}>
            {options}
          </Select>
        </FormControl>
      );
    }

    return (
      <FormControl key={field.id}>
        <FormControl.Label>{field.name}</FormControl.Label>
        <TextInput
          {...register(field.name)}
          name={field.name}
          type={field.type}
        />
      </FormControl>
    );
  });

  if (submittedIssueUrl) {
    return (
      <Box
        mt="4"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Box alignSelf="center">
          <Text textAlign="center">
            Issue submitted:{" "}
            <Link href={submittedIssueUrl}>{submittedIssueUrl}</Link>
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <ContentWrapper>
      <Box sx={{ display: "grid", gridGap: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl required>
            <FormControl.Label>Issue title</FormControl.Label>
            <TextInput
              {...register("title", {
                validate: (value) => {
                  if (value === "") {
                    return "Title is required.";
                  }
                },
              })}
              block
            />
            {formState.errors.title && (
              <span className="error">{formState.errors.title.message}</span>
            )}
          </FormControl>

          {projectFieldsElements}

          <FormControl>
            <FormControl.Label>Issue description</FormControl.Label>
            <Textarea block {...register("body")}></Textarea>
          </FormControl>
          <Box display="flex" justifyContent="right">
            <Button
              type="submit"
              variant="primary"
              disabled={!formState.isValid || isSubmittingIssue}
            >
              {isSubmittingIssue && <Spinner size="small" />}
              Submit new issue
            </Button>
          </Box>
        </form>
      </Box>
    </ContentWrapper>
  );
}
