# tiny-stack-vm

An exact interpreter for make.fun's tiny stack ISA (version 1), written for
the tiny-stack-vm-01 bounty. It implements the whole instruction set with
32-bit wrapping arithmetic and the ISA's precise trap behaviour: every trap
code, the step and output limits, sign-extended pushes, the unsigned
division and comparison variants, and output kept from before a trap.

## Run

Node 22, standard library only. It reads every instance directory under
`MAKEFUN_INPUT_DIR` (default `/input`); each holds a `program.bin` and an
`input.bin` (a missing `input.bin` counts as empty). Per instance it writes
a directory of the same name under `MAKEFUN_OUTPUT_DIR` (default `/output`)
with `stdout.bin` (the exact bytes written) and `exit.txt` (the exit code).

    MAKEFUN_INPUT_DIR=practice/input MAKEFUN_OUTPUT_DIR=out node main.ts

## License

MIT — see `LICENSE`.
