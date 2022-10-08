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
     padding:"2px",
    '&:hover': {
      backgroundColor: "#b9b5b5",
      borderRadius: '50%', 
    }

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
  addItem: (item: TodoItem | TodoItem[]) => void;
  setItemsCallback: (updatedItems: TodoItem[]) => void;
}

export const Item: FC<Props> = ({
  items,
  itemIndex,
  setItemsCallback,
  addItem,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const classes = useStyles();

  const [itemText, setItemText] = useState("");
  const [draggable, setDraggable] = useState(false);

  useEffect(() => {
    items[itemIndex].name.length < 2 &&
      inputRef.current &&
      inputRef.current.focus();
    setItemText(items[itemIndex].name);
  }, []);

  if (!items[itemIndex].isComplete) {
    return (
      <Reorder.Item
        value={items[itemIndex]?.uuid}
        className={classes.reorderItem}
        dragListener={draggable}
        onDragEnd={() => setDraggable(false)}
        style={{ boxShadow, y }}
      >
        <Container className={classes.root}>
          <DragIndicatorIcon
            className={classes.dragIndicatorIcon}
            onMouseEnter={() => setDraggable(true)}
            onMouseLeave={() => setDraggable(false)} // retain this for better animation
            onTouchStart={() => setDraggable(true)} // for mobile: need to set draggable to `false` in `onDragEnd` prop, not `onTouchEnd`
          />
          <Checkbox
            onChange={() => {
              items[itemIndex].isComplete = true;
              setItemsCallback([...items]);
            }}
          />
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
              }}
              onChange={(e) => {
                if(e.target.value === "" || e.target.value === undefined) {
                  items.splice(itemIndex, 1);
                  setItemsCallback([...items])
                } else {
                  items[itemIndex].name = e.target.value;
                  setItemText(e.target.value);
                }
              }}
              onBlur={() => {
                setItemsCallback([...items]);
              }}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                itemIndex < 1 &&
                addItem({ name: "", uuid: uuid(), isComplete: false })
              }
            />
          </FormControl>
          <CloseIcon
            className={classes.closeIcon}
            onClick={() => {
              items.splice(itemIndex, 1);
              setItemsCallback([...items]);
            }}
          />
        </Container>
      </Reorder.Item>
    );
  }

  return null;
};
