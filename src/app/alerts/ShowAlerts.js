import * as React from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

export default function ShowAlerts({ type , message }) {
  return (
    <Stack sx={{ width: "100%", marginBottom:"20px" }} spacing={2}>
      {type === "success" && (
        <Alert variant="filled" severity="success">
         {message}
        </Alert>
      )}

      {type === "error" && (
       <Alert variant="filled" severity="error">
        {message}
      </Alert>
      )}
    </Stack>
  );
}
