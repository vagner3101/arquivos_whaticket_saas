import { Op, fn, where, col, Filterable, Includeable, Sequelize } from "sequelize";
import { startOfDay, endOfDay, parseISO } from "date-fns";

import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import { intersection } from "lodash";
import Whatsapp from "../../models/Whatsapp";
import isQueueIdHistoryBlocked from "../UserServices/isQueueIdHistoryBlocked";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  date?: string;
  updatedAt?: string;
  showAll?: string;
  userId: number;
  withUnreadMessages?: string;
  queueIds: number[];
  tags: number[];
  users: number[];
  companyId: number;
}

interface Response {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}

const ListTicketsService = async ({
  searchParam = "",
  pageNumber = "1",
  queueIds,
  tags,
  users,
  status,
  date,
  updatedAt,
  showAll,
  userId,
  withUnreadMessages,
  companyId
}: Request): Promise<Response> => {

  const isAllHistoricEnabled = await isQueueIdHistoryBlocked({ userRequest: userId });
  const user = await ShowUserService(userId);
  const userQueueIds = user.queues.map(queue => queue.id);

  let whereCondition: Filterable["where"];

  if (!isAllHistoricEnabled) {
    whereCondition = {
    [Op.or]: [{ userId }, { status: "pending" }],
      queueId: { [Op.or]: [queueIds, null] },
      companyId
  };
  } else {
    whereCondition = {
      [Op.or]: [{ userId }, { status: "pending" }],
      companyId
    };
  }



  let includeCondition: Includeable[];

  includeCondition = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "email", "profilePicUrl"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    },
    {
      model: Whatsapp,
      as: "whatsapp",
      attributes: ["name"]
    },
  ];

  if (user.profile === "user" && user.allTicket === "enable") {
    const TicketsUserFilter: any[] | null = [];

    let ticketsIds = [];

    if (!isAllHistoricEnabled) {
      ticketsIds = await Ticket.findAll({
        where: {
          userId: { [Op.or]: [user.id, null] },
          queueId: { [Op.or]: [queueIds, null] },
          // status: "pending",
          companyId
        },
      });
    } else {
      ticketsIds = await Ticket.findAll({
        where: {
          userId: { [Op.or]: [user.id, null] },
          // queueId: { [Op.or]: [queueIds, null] },
          // status: "pending",
          companyId
        },
      });
    }

    if (ticketsIds) {
      TicketsUserFilter.push(ticketsIds.map(t => t.id));
    }
    // }

    const ticketsIntersection: number[] = intersection(...TicketsUserFilter);

    whereCondition = {
      ...whereCondition,
      id: ticketsIntersection
    };
  }


  if (user.profile === "user" && user.allTicket === "disable") {
    const TicketsUserFilter: any[] | null = [];

    let ticketsIds = [];

    if (!isAllHistoricEnabled) {
      ticketsIds = await Ticket.findAll({
        where: {
          companyId,
          userId:
            { [Op.or]: [user.id, null] },
          //status: "pending",
          queueId: queueIds
        },
      });
    } else {
      ticketsIds = await Ticket.findAll({
        where: {
          userId: { [Op.or]: [user.id, null] },
          companyId,
          queueId: { [Op.not]: null }
          // queueId: { [Op.in] : queueIds},
        },
      });
    }

    if (ticketsIds) {
      TicketsUserFilter.push(ticketsIds.map(t => t.id));
    }
    // }

    const ticketsIntersection: number[] = intersection(...TicketsUserFilter);

    whereCondition = {
      ...whereCondition,
      id: ticketsIntersection
    };
  }

  if (showAll === "true" && (user.profile === "admin" || user.allUserChat === "enabled")) {
    if (isAllHistoricEnabled) {
      whereCondition = {}
    } else {
    whereCondition = { queueId: { [Op.or]: [queueIds, null] } };
  }
  }



  if (status) {
    whereCondition = {
      ...whereCondition,
      status
    };
  }

  if (searchParam) {
    const sanitizedSearchParam = searchParam.toLocaleLowerCase().trim();

    includeCondition = [
      ...includeCondition,
      {
        model: Message,
        as: "messages",
        attributes: ["id", "body"],
        where: {
          body: where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        required: false,
        duplicating: false
      }
    ];

    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          "$contact.name$": where(
            fn("LOWER", col("contact.name")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { "$contact.number$": { [Op.like]: `%${sanitizedSearchParam}%` } },
        {
          "$message.body$": where(
            fn("LOWER", col("body")),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        }
      ]
    };
  }

  if (date) {
    whereCondition = {
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(date)), +endOfDay(parseISO(date))]
      }
    };
  }

  if (updatedAt) {
    whereCondition = {
      updatedAt: {
        [Op.between]: [
          +startOfDay(parseISO(updatedAt)),
          +endOfDay(parseISO(updatedAt))
        ]
      }
    };
  }

  if (withUnreadMessages === "true") {
    whereCondition = {
      [Op.or]: [{ userId }, { status: "pending" }],
      queueId: { [Op.or]: [userQueueIds, null] },
      unreadMessages: { [Op.gt]: 0 }
    };
  }

  if (Array.isArray(tags) && tags.length > 0) {
    const ticketsTagFilter: any[] | null = [];
    for (let tag of tags) {
      const ticketTags = await TicketTag.findAll({
        where: { tagId: tag }
      });
      if (ticketTags) {
        ticketsTagFilter.push(ticketTags.map(t => t.ticketId));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsTagFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  if (Array.isArray(users) && users.length > 0) {
    const ticketsUserFilter: any[] | null = [];
    for (let user of users) {
      const ticketUsers = await Ticket.findAll({
        where: { userId: user }
      });
      if (ticketUsers) {
        ticketsUserFilter.push(ticketUsers.map(t => t.id));
      }
    }

    const ticketsIntersection: number[] = intersection(...ticketsUserFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: ticketsIntersection
      }
    };
  }

  const limit = 40;
  const offset = limit * (+pageNumber - 1);

  whereCondition = {
    ...whereCondition,
    companyId
  };

  const { count, rows: tickets } = await Ticket.findAndCountAll({
    where: whereCondition,
    include: includeCondition,
    distinct: true,
    limit,
    offset,
    order: [["updatedAt", "DESC"]],
    subQuery: false
  });

  const hasMore = count > offset + tickets.length;

  return {
    tickets,
    count,
    hasMore
  };
};

export default ListTicketsService;
