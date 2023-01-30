import { AppModule } from "src/app.module"
import { Test } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import * as pactum from 'pactum'
import { AuthDto } from "src/auth/dto"
import { EditUserDto } from "src/user/dto"
import { CreateBookmarkDto, EditBookmarkDto } from "src/bookmark/dto"

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }))

    await app.init()
    await app.listen(3333)

    prisma = moduleRef.get(PrismaService)

    await prisma.cleanDb()
    pactum.request.setBaseUrl('http://localhost:3333')
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'example@email.com',
      password: '123456'
    }
    describe('Signup', () => {
      it('should throw if email is empty', () => {
        return pactum.spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            email: ''
          })
          .expectStatus(400)
      })

      it('should throw if password is empty', () => {
        return pactum.spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: ''
          })
          .expectStatus(400)
      })

      it('should signup a new user', () => {
        return pactum.spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })

      it('should throw an error if the email is already in use', () => {
        return pactum.spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(403)
      })

    })

    describe('Signin', () => {
      it('should signin a user', () => {
        return pactum.spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
      })

      it('should throw if email is empty', () => {
        return pactum.spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            email: ''
          })
          .expectStatus(400)
      })

      it('should throw if password is empty', () => {
        return pactum.spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            password: ''
          })
          .expectStatus(400)
      })

      it('should throw if the user does not exist', () => {
        return pactum.spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            email: 'notauser@example.com'
          })
      })

      it('should throw if the password is incorrect', () => {
        return pactum.spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            password: 'incorrectpassword'
          })
      })
    })
  })

  describe('Users', () => {
    describe('Get me', () => {
      it('should return the current user', () => {
        return pactum.spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })
    })

    describe('Edit user', () => {
      it('should edit the current user', () => {
        const dto: EditUserDto = {
          name: 'New name',
          email: 'new@email.com'
        }

        return pactum.spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.name)
          .expectBodyContains(dto.email)
      })
    })
  })
  describe('Bookmarks', () => {

    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .inspect()
          .expectBody([])
      })
    })

    describe('Create bookmark', () => {
      it('should create a new bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'New bookmark',
          link: 'https://example.com'
        }

        return pactum.spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(201)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.link)
          .stores('bookmarkId', 'id')
      })
    })

    describe('Get all bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })

    describe('Get bookmark by id', () => {
      it('should return a bookmark by id', () => {
        return pactum.spec()
          .get('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'New title',
        link: 'https://newlink.com'
      }

      it('should edit a bookmark by id', () => {
        return pactum.spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)

      })
    })

    describe('Delete bookmark', () => {
      it('should delete a bookmark', () => {
        return pactum.spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(204)
      })
    })
  })
})
