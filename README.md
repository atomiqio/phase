phase
=====

Phase provides a simple, intuitive, easy to write and easy to process set of rules that can be transformed into JSON Schema.

Example
-------

#### Phase Schema

The following Phase schema sample is based on the Swagger Petstore schema:

```
Pet {
   id integer @format('int64')
   name string @required
   category $Category
   photoUrls [string] @required
   tags [$Tag]
   status string @description('pet status in the store')
                 @enum('available', 'pending', 'sold')
}

Category {
  id integer @format('int64')
  name string
}

Tag {
  id integer @format('int64')
  name string
}
```

#### JSON Schema

Phase transforms this into the following JSON Schema:

```
{
  "definitions": {
    "Pet": {
      "type": "object",
      "required": [
        "name",
        "photoUrls"
      ],
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "category": {},
        "name": {
          "type": "string"
        },
        "photoUrls": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "tags": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Tag"
          }
        },
        "status": {
          "type": "string",
          "description": "pet status in the store",
          "enum": [
            "available",
            "pending",
            "sold"
          ]
        }
      }
    },
    "Category": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "name": {
          "type": "string"
        }
      }
    },
    "Tag": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "format": "int64"
        },
        "name": {
          "type": "string"
        }
      }
    }
  }
}
```

#### JSON Data

According to the schema, the following is a valid instance:

```
{
  "name": "Fido",
  "photoUrls": []
}
```

And so is this:

```
{
  "id": 101,
  "name": "Fido",
  "category": {
    "id": "10",
    "name": "Boxer"
  },
  "photoUrls": [ "https://pixabay.com/static/uploads/photo/2014/07/05/08/50/puppy-384647_640.jpg" ],
  "tags": [ "puppy" ]
}
```





## For more information

See the [wiki](https://github.com/atomiqio/phase/wiki) to learn more about Phase.

