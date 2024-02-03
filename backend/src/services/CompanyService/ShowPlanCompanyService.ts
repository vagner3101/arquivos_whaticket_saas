import Company from "../../models/Company";
import Plan from "../../models/Plan";

const ShowPlanCompanyService = async (id: string | number): Promise<Company> => {
    const companies = await Company.findOne({
        where: { id },
        attributes: ["id", "name", "email", "status", "dueDate", "createdAt", "phone", "document", "lastLogin"],
        order: [["name", "ASC"]],
        include: [
            {
                model: Plan, as: "plan",
                attributes: [
                    "id",
                    "name",
                    "users",
                    "connections",
                    "queues",
                    "value"
                ]
            },
        ]
    });

    return companies;
};

export default ShowPlanCompanyService;
