import {
  Box,
  Button,
  FormControl,
  Link,
  Spinner,
  Text,
  Textarea,
  TextInput,
} from "@primer/react";
import { useForm } from "react-hook-form";

export default function NewIssueForm({
  // onSubmit,
  submittedIssueUrl,
  projectFields,
  isSubmittingIssue,
}) {
  const { formState, register, handleSubmit } = useForm({
    mode: "onTouched",
    defaultValues: {
      title: "",
      body: "",
    },
  });
  const onSubmit = (data) => {
    // TODO: figure out why project fields are not set on data
    console.log(data);
  };

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
    <>
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
          </FormControl>

          {projectFields}

          <FormControl>
            <FormControl.Label>Issue description</FormControl.Label>
            <Textarea
              block
              {...register("body", {
                validate: (value) => {
                  if (value === "") {
                    return "Title is required.";
                  }
                },
              })}
            ></Textarea>
          </FormControl>
          <Box display="flex" justifyContent="right">
            <Button
              type="submit"
              variant="primary"
              disabled={!formState.isValid}
            >
              {isSubmittingIssue && <Spinner size="small" />}
              Submit new issue
            </Button>
          </Box>
        </form>
      </Box>
    </>
  );
}
