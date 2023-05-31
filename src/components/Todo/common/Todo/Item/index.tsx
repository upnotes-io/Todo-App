import React, { FC, useEffect, useRef, useState } from "react";

import uuid from "react-uuid";
import {
  Checkbox,
  Container,
  FormControl,
  makeStyles,
  TextField,
} from "@material-ui/core";
import { Reorder, useMotionValue } from "framer-motion";
import CloseIcon from "@material-ui/icons/Close";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import useRaisedShadow from "./useRaisedShadow";
import { TodoItem } from "../../types";

const useStyles = makeStyles({
  root: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    zIndex: 0,
  },
  underline: {
    "&&&:before": {
      borderBottom: "none",
    },
  },
  textFeild: {
    padding: "10px 0px 7px",
  },
  dragIndicatorIcon: {
    cursor: "grab",
  },
  closeIcon: {
    cursor: "pointer",
    padding: "2px",
    "&:hover": {
      backgroundColor: "#b9b5b5",
      borderRadius: "50%",
    },
  },
  reorderItem: {
    listStyle: "none",
    position: "relative",
    backgroundColor: "white",
  },
});

interface Props {
  items: TodoItem[];
  itemIndex: number;
  addItem: (
    item: TodoItem | TodoItem[],
    cursorLocation?: number | null | undefined,
    itemIndex?: number | undefined
  ) => void;
  changeFocus: (focusIndex: number) => void;
  focus: number;
  onRemoveItem: (uuid: string) => void;
  onUpdateItem: (data: TodoItem) => void;
}

export const Item: FC<Props> = ({
  items,
  itemIndex,
  addItem,
  changeFocus,
  focus,
  onRemoveItem,
  onUpdateItem,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const classes = useStyles();

  const [itemText, setItemText] = useState("");
  const [draggable, setDraggable] = useState(false);

  const [xPosition, setXPosition] = useState(false);

  useEffect(() => {
    if (focus === itemIndex) {
      inputRef.current && inputRef.current.focus();
      changeFocus(-1);
    }
    setItemText(items[itemIndex].name);
  }, [changeFocus, focus, itemIndex, items]);

  if (!items[itemIndex].isComplete) {
    return (
      <Reorder.Item
        value={items[itemIndex]?.uuid}
        className={classes.reorderItem}
        dragListener={draggable}
        onDragEnd={() => setDraggable(false)}
        style={{ boxShadow, y , left: xPosition? 30: 0}}
        drag
        dragDirectionLock
        onDirectionLock={()=>setXPosition(!xPosition)}
        dragConstraints = {{left:-30, right:30}}
      >
        <Container className={classes.root}>
          <DragIndicatorIcon
            className={classes.dragIndicatorIcon}
            onMouseEnter={() => setDraggable(true)}
            onMouseLeave={() => setDraggable(false)} // retain this for better animation
            onTouchStart={() => setDraggable(true)} // for mobile: need to set draggable to `false` in `onDragEnd` prop, not `onTouchEnd`
          />
          <Checkbox onChange={() => onUpdateItem({ ...items[itemIndex], isComplete: true })} />
          <FormControl fullWidth>
            <TextField
              className={classes.textFeild}
              InputProps={{ classes: { underline: classes.underline } }}
              inputRef={inputRef}
              value={itemText} // innerHTML of the editable div
              onPaste={(e) => {
                // Stop data actually being pasted into div
                e.stopPropagation();
                e.preventDefault();

                // Get pasted data via clipboard API
                const clipboardData = e.clipboardData;
                const pastedData = clipboardData
                  .getData("Text")
                  .split("\n")
                  .reverse()
                  .filter((name) => name.trim() !== "");

                // Do whatever with pasteddata
                const items = pastedData.map((name) => {
                  return { name, uuid: uuid(), isComplete: false };
                });
                addItem(items);
                changeFocus(-1);
              }}
              onChange={(e) => {
                setItemText(e.target.value);
              }}
              onBlur={() => {
                if (itemText === items[itemIndex].name) return;

                onUpdateItem({ ...items[itemIndex], name: itemText });
              }}
              onKeyPress={(e) => {
                const inputElement = e.target as HTMLInputElement;
                const cursorLocation = inputElement.selectionStart;
                const submittedItemText = itemText;
                e.key === "Enter" &&
                  // leaving the bottom line commented out so addItem() can be invoked from any index
                  // itemIndex < 1 &&
                  addItem(
                    {
                      name: submittedItemText,
                      uuid: uuid(),
                      isComplete: false,
                    },
                    cursorLocation,
                    itemIndex
                  );
              }}
              onKeyDown={(e) => {
                const inputs = document.querySelectorAll("input[type='text']");
                const inputsArray = Array.from(inputs);
                const index = inputsArray.indexOf(inputRef.current as HTMLInputElement);

                if (inputRef.current) {
                  if (e.key === "ArrowUp") {
                    // Move cursor to the previous item
                    // Checks if the focused-item is at the top
                    if (index >= 0) {
                      const nextInputElement = inputsArray[index - 1] as HTMLInputElement;
                      nextInputElement.focus();
                    }
                  } else if (e.key === "ArrowDown") {
                    // Move cursor to the next item
                    // Checks if the focused item is at the bottom
                    if (index < inputsArray.length - 1) {
                      const nextInputElement = inputsArray[index + 1] as HTMLInputElement;
                      nextInputElement.focus();
                      // below code moves cursor to beginning of input element
                      requestAnimationFrame(() => {
                        nextInputElement.setSelectionRange(0, 0);
                      });
                    }
                  }
                }
              }}
            />
          </FormControl>
          <CloseIcon
            className={classes.closeIcon}
            onClick={() => {
              const { uuid } = items[itemIndex];
              onRemoveItem(uuid);
            }}
          />
        </Container>
      </Reorder.Item>
    );
  }

  return null;
};
