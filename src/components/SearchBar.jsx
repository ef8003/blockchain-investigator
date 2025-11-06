import { useState } from "react";
import { TextField, Button, Stack } from "@mui/material";

export default function SearchBar({ onSubmit }) {
  const [value, setValue] = useState("");

  return (
    <Stack direction="row" spacing={2} sx={{ p: 2 }}>
      <TextField
        label="Bitcoin Address"
        value={value}
        onChange={e => setValue(e.target.value.trim())}
        fullWidth
        size="small"
      />
      <Button variant="contained" onClick={() => onSubmit(value)} disabled={!value}>
        Load
      </Button>
    </Stack>
  );
}
