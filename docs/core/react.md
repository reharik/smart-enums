# React

Because members carry both a `value` (for form state and submission) and a `display` (for rendering), enums map cleanly onto controlled inputs. `items()` gives you the options; `fromValue()` turns a changed value back into a member.

```tsx
function StatusPicker() {
  const [selected, setSelected] = useState(Status.pending);

  return (
    <select
      value={selected.value}
      onChange={e => setSelected(Status.fromValue(e.target.value))}
    >
      {Status.items().map(item => (
        <option key={item.value} value={item.value}>
          {item.display}
        </option>
      ))}
    </select>
  );
}
```

The `<select>` holds `selected.value` (a string, which the DOM wants), and `onChange` immediately maps the raw value back to the real member with `fromValue` — so the rest of your component works with `selected`, a full enum member with `.display`, `.key`, and any custom fields.

If you're on Apollo Client, you can have query results arrive as smart-enum members automatically instead of doing this lookup yourself everywhere. See [Apollo type policies](/graphql/type-policies).
